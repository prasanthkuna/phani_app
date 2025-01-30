from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer, UpdateOrderSerializer
from products.models import Product
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.admin_views import IsManagerPermission

User = get_user_model()

# Create your views here.

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shipping_address', 'user__username', 'user__email', 'items__product__name']
    ordering_fields = ['created_at', 'updated_at', 'total_amount', 'status']
    ordering = ['-created_at']
    http_method_names = ['get', 'post', 'patch', 'delete']  # Explicitly allow POST
    queryset = Order.objects.prefetch_related('items', 'items__product')
    
    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all() if user.role == 'MANAGER' else Order.objects.filter(user=user)
        
        # Get filter parameters
        search_query = self.request.query_params.get('search', '')
        status_filter = self.request.query_params.get('status', '')
        payment_filter = self.request.query_params.get('payment_status', '')
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply payment status filter
        if payment_filter == 'overdue':
            from django.utils import timezone
            from datetime import timedelta
            deadline_threshold = timezone.now() - timedelta(days=1)  # At least 1 day overdue
            queryset = queryset.filter(
                status='pending',
                created_at__lte=deadline_threshold - timedelta(days=7)  # Default payment_deadline
            )
        elif payment_filter == 'due_soon':
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now()
            deadline_threshold = now - timedelta(days=4)  # 3 days remaining
            queryset = queryset.filter(
                status='pending',
                created_at__gte=deadline_threshold - timedelta(days=7),  # Default payment_deadline
                created_at__lte=now - timedelta(days=1)  # At least 1 day remaining
            )
        
        # Apply OR filter if search is provided
        if search_query:
            queryset = queryset.filter(
                Q(user__username__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(items__product__name__icontains=search_query)
            ).distinct()
        
        return queryset.prefetch_related('items', 'items__product', 'user')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        elif self.action == 'update_order':
            return UpdateOrderSerializer
        return OrderSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            created_by_role=self.request.user.role
        )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Use OrderSerializer to return full order details with context
        response_serializer = OrderSerializer(order, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
    def update(self, request, *args, **kwargs):
        # Only managers can update orders
        if request.user.role != 'MANAGER':
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
        
    def destroy(self, request, *args, **kwargs):
        # Only managers can delete orders
        if request.user.role != 'MANAGER':
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerPermission])
    def accept(self, request, pk=None):
        order = self.get_object()
        order.accept_order()
        return Response({'status': 'order accepted'})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerPermission])
    def reject(self, request, pk=None):
        order = self.get_object()
        order.reject_order()
        return Response({'status': 'order rejected'})

    @action(detail=True, methods=['patch'], permission_classes=[IsManagerPermission])
    def update_order(self, request, pk=None):
        order = self.get_object()
        serializer = self.get_serializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            updated_order = serializer.save()
            response_serializer = OrderSerializer(updated_order, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
