"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet, login_view, logout_view, csrf_token, register_view, session_check
from users.admin_views import UserManagementViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

# Create a router for admin endpoints
admin_router = DefaultRouter()
admin_router.register(r'manage', UserManagementViewSet)

# Create a router for user endpoints
user_router = DefaultRouter()
user_router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/csrf/', csrf_token),
    path('api/auth/register/', register_view),
    path('api/auth/login/', login_view),
    path('api/auth/logout/', logout_view),
    path('api/auth/session/', session_check),
    path('api/', include(user_router.urls)),
    path('api/admin/', include(admin_router.urls)),  # Changed from api/users/ to api/admin/
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/shopping-cart/', include('shopping_cart.urls')),
]

# Serve media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        path('media/<path:path>/', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
