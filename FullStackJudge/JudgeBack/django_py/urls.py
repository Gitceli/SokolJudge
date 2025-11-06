# django_py/urls.py
from rest_framework.routers import DefaultRouter
from .views import ContesterViewSet, JudgeRatingViewSet, DifficultyScoreViewSet, JudgeRegisterView, MeView
from django.urls import path

router = DefaultRouter()
router.register(r'contesters', ContesterViewSet, basename='contester')
router.register(r'ratings', JudgeRatingViewSet, basename='rating')
router.register(r'difficulty-scores', DifficultyScoreViewSet, basename='difficulty-score')

urlpatterns = [
    path("auth/register/", JudgeRegisterView.as_view(), name="judge-register"),
    path("auth/me/", MeView.as_view(), name="judge-me"),
] + router.urls
