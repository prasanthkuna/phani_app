from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet

router = DefaultRouter()
router.register('', CartViewSet, basename='shopping-cart')

urlpatterns = [
    path('', include(router.urls)),
] 