from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, login_view, logout_view, csrf_token, get_user_stats
from .admin_views import UserManagementViewSet

router = DefaultRouter()
router.register('users', UserViewSet)

admin_router = DefaultRouter()
admin_router.register(r'manage', UserManagementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/csrf/', csrf_token, name='csrf_token'),
    path('stats/', get_user_stats, name='user-stats'),
] 