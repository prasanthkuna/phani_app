from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CartViewSet

# Create separate routers for orders and cart
order_router = DefaultRouter()
cart_router = DefaultRouter()

# Register viewsets
order_router.register('', OrderViewSet, basename='order')
cart_router.register('', CartViewSet, basename='cart')

# Include both routers with their respective prefixes
urlpatterns = [
    path('cart/', include(cart_router.urls)),  # Cart URLs must come first
    path('', include(order_router.urls)),      # Then order URLs
] 