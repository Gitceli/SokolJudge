# JudgeBack/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include('django_py.urls')),

    # DRF auth
    path('api/token-auth/', obtain_auth_token),
    path('api/api-auth/', include('rest_framework.urls')),
]
