from rest_framework import serializers
from .models import Judge, Contester, JudgeRating, DifficultyScore
from django.utils.text import slugify

from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password



class JudgeRegisterSerializer(serializers.ModelSerializer):
    # username removed
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    judge_type = serializers.ChoiceField(choices=Judge.JUDGE_TYPE_CHOICES, default='execution')

    class Meta:
        model = Judge
        fields = ['email', 'password', 'password2', 'name', 'surname', 'judge_type']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Gesli se ne ujemata.")
        return data

    def _unique_username(self, base):
        username = base
        i = 1
        while User.objects.filter(username=username).exists():
            i += 1
            username = f"{base}{i}"
        return username

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')
        email = validated_data.pop('email', '')

        base = slugify(f"{validated_data['name']}.{validated_data['surname']}")  # ime.priimek
        username = self._unique_username(base)

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=validated_data['name'],
            last_name=validated_data['surname'],
        )

        group, _ = Group.objects.get_or_create(name='Judge')
        user.groups.add(group)

        count = Judge.objects.count() + 1
        judge_number = f"E{count}"

        judge = Judge.objects.create(user=user, judge_number=judge_number, **validated_data)
        return judge


class JudgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Judge
        fields = ['id', 'name', 'surname', 'judge_number', 'is_main_judge', 'judge_type']


class JudgeRatingSerializer(serializers.ModelSerializer):
    judge = JudgeSerializer(read_only=True)
    judge_id = serializers.PrimaryKeyRelatedField(
        queryset=Judge.objects.all(), source='judge', write_only=True
    )

    class Meta:
        model = JudgeRating
        fields = ['id', 'contester', 'judge', 'judge_id', 'round_number', 'score', 'landing_score', 'deduction', 'timestamp']


class ContesterSerializer(serializers.ModelSerializer):
    ratings = JudgeRatingSerializer(many=True, read_only=True)

    class Meta:
        model = Contester
        read_only_fields = ['active']  # prevent judges from toggling
        fields = [
            'id', 'name', 'surname', 'competitor_number', 'group', 'club',
            'HD', 'Tof', 'D', 'P', 'active', 'ratings'
        ]


class DifficultyScoreSerializer(serializers.ModelSerializer):
    judge = JudgeSerializer(read_only=True)
    judge_id = serializers.PrimaryKeyRelatedField(
        queryset=Judge.objects.all(), source='judge', write_only=True
    )

    class Meta:
        model = DifficultyScore
        fields = ['id', 'contester', 'judge', 'judge_id', 'difficulty', 'timestamp']
