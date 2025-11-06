#  views.py
from rest_framework import viewsets, permissions, mixins, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView


from .models import Judge, Contester, JudgeRating, DifficultyScore
from .serializers import (
    JudgeSerializer,
    ContesterSerializer,
    JudgeRatingSerializer,
    JudgeRegisterSerializer,
    DifficultyScoreSerializer
)



# ✅ Registration view (standalone)
class JudgeRegisterView(generics.CreateAPIView):
    serializer_class = JudgeRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        judge = serializer.save()  # Judge instance

        user = judge.user
        token, _ = Token.objects.get_or_create(user=user)

        data = {
        "detail": "Registracija uspešna.",
        "token": token.key,
        "username": user.username,
        "judge": {
            "id": judge.id,
            "name": judge.name,
            "surname": judge.surname,
            "judge_number": judge.judge_number,
            "is_main_judge": judge.is_main_judge,
            "judge_type": judge.judge_type,
        }
    }
        return Response(data, status=status.HTTP_201_CREATED)

# ---------- custom permission ----------
class IsJudgeUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, "judge_profile")


class IsMainJudge(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                hasattr(request.user, "judge_profile") and
                request.user.judge_profile.is_main_judge)


# ---------- contesters ----------
class ContesterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Contester.objects.all().order_by("competitor_number")
    serializer_class = ContesterSerializer

    def get_permissions(self):
        if self.action == "active":
            return [IsJudgeUser()]
        if self.action == "results":
            return [permissions.AllowAny()]  # Public access for contestants to view results
        if self.action in ["list", "retrieve", "set_active"]:
            return [IsMainJudge()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=["get"])
    def active(self, request):
        qs = self.get_queryset().filter(active=True)
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page else Response(ser.data)

    @action(detail=True, methods=["post"], permission_classes=[IsMainJudge])
    def set_active(self, request, pk=None):
        """Main judge can set a competitor as active (and deactivate all others)"""
        contester = self.get_object()
        # Deactivate all other contesters
        Contester.objects.all().update(active=False)
        # Activate this one
        contester.active = True
        contester.save()
        return Response({
            "detail": f"{contester.name} {contester.surname} is now active",
            "active_contester": self.get_serializer(contester).data
        })

    @action(detail=False, methods=["get"], permission_classes=[IsJudgeUser])
    def results(self, request):
        """Get all contestants with their ratings organized by judge and round"""
        contesters = self.get_queryset()
        results = []

        for contester in contesters:
            # Get all ratings for this contester, organized by judge
            ratings = contester.ratings.select_related('judge').order_by('judge__judge_number', 'round_number')

            # Organize by judge
            judge_data = {}
            for rating in ratings:
                judge_num = rating.judge.judge_number
                if judge_num not in judge_data:
                    judge_data[judge_num] = {
                        'judge_id': rating.judge.id,
                        'judge_number': judge_num,
                        'judge_name': f"{rating.judge.name} {rating.judge.surname}",
                        'rounds': []
                    }
                judge_data[judge_num]['rounds'].append({
                    'round_number': rating.round_number,
                    'score': rating.score,
                    'timestamp': rating.timestamp
                })

            # Calculate statistics
            all_scores = [r.score for r in ratings]
            best_score = max(all_scores) if all_scores else 0
            avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
            total_rounds = len(all_scores)

            results.append({
                'id': contester.id,
                'name': contester.name,
                'surname': contester.surname,
                'competitor_number': contester.competitor_number,
                'group': contester.group,
                'club': contester.club,
                'active': contester.active,
                'judges': list(judge_data.values()),
                'statistics': {
                    'best_score': round(best_score, 2),
                    'average_score': round(avg_score, 2),
                    'total_rounds': total_rounds,
                    'completed_rounds': len(set(r.round_number for r in ratings))
                }
            })

        return Response(results)

    @action(detail=False, methods=["post"], permission_classes=[IsMainJudge])
    def reset_all_scores(self, request):
        """Main judge can reset all scores (delete all ratings) for a new competition"""
        try:
            # Delete all ratings (execution judges)
            deleted_ratings = JudgeRating.objects.all().delete()[0]
            # Delete all difficulty scores (difficulty judges)
            deleted_difficulty = DifficultyScore.objects.all().delete()[0]
            # Reset all contesters to inactive
            Contester.objects.all().update(active=False)

            total_deleted = deleted_ratings + deleted_difficulty

            return Response({
                "detail": f"Uspešno izbrisanih {total_deleted} ocen ({deleted_ratings} izvedb, {deleted_difficulty} težavnosti). Vsi tekmovalci so označeni kot neaktivni.",
                "deleted_count": total_deleted
            })
        except Exception as e:
            return Response(
                {"detail": f"Napaka pri ponastavljanju: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---------- ratings (per-judge endpoint) ----------
class JudgeRatingViewSet(mixins.ListModelMixin,
                         mixins.CreateModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = JudgeRatingSerializer
    permission_classes = [IsJudgeUser]

    def get_queryset(self):
        return JudgeRating.objects.filter(judge=self.request.user.judge_profile).order_by("-timestamp")

    def perform_create(self, serializer):
        judge = self.request.user.judge_profile
        contester = serializer.validated_data["contester"]
        round_number = serializer.validated_data["round_number"]

        if not contester.active:
            raise serializers.ValidationError("You can score only the active contester.")

        # Use update_or_create to allow re-submission of ratings
        # This allows judges to correct their scores if needed
        JudgeRating.objects.update_or_create(
            contester=contester,
            judge=judge,
            round_number=round_number,
            defaults={
                'score': serializer.validated_data.get('score', 0),
                'landing_score': serializer.validated_data.get('landing_score', 0),
                'deduction': serializer.validated_data.get('deduction', 0),
            }
        )


class MeView(APIView):
    permission_classes = [IsJudgeUser]
    def get(self, request):
        j = request.user.judge_profile
        return Response({
            "id": j.id,
            "name": j.name,
            "surname": j.surname,
            "judge_number": j.judge_number,
            "is_main_judge": j.is_main_judge,
            "judge_type": j.judge_type
        })


# ---------- difficulty scores (per-difficulty-judge endpoint) ----------
class DifficultyScoreViewSet(mixins.ListModelMixin,
                             mixins.CreateModelMixin,
                             viewsets.GenericViewSet):
    serializer_class = DifficultyScoreSerializer
    permission_classes = [IsJudgeUser]

    def get_queryset(self):
        return DifficultyScore.objects.filter(judge=self.request.user.judge_profile).order_by("-timestamp")

    def perform_create(self, serializer):
        judge = self.request.user.judge_profile
        contester = serializer.validated_data["contester"]

        # Only difficulty judges can use this endpoint
        if judge.judge_type != 'difficulty':
            raise serializers.ValidationError("Only difficulty judges can submit difficulty scores.")

        if not contester.active:
            raise serializers.ValidationError("You can score only the active contester.")

        # Use update_or_create to allow re-submission of difficulty scores
        # This allows difficulty judges to correct their scores if needed
        DifficultyScore.objects.update_or_create(
            contester=contester,
            judge=judge,
            defaults={
                'difficulty': serializer.validated_data.get('difficulty', 0),
            }
        )