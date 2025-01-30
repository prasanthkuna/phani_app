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
from users.models import EmployeeCustomerAssignment

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
        queryset = super().get_queryset()
        user = self.request.user
        status = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')

        # Apply status filter if provided
        if status:
            queryset = queryset.filter(status__iexact=status)

        # Apply user_id filter if provided (for managers and employees)
        if user_id and user.role in ['MANAGER', 'EMPLOYEE']:
            try:
                target_user = User.objects.get(id=user_id)
                # For employees, verify they are assigned to this customer
                if user.role == 'EMPLOYEE':
                    is_assigned = EmployeeCustomerAssignment.objects.filter(
                        employee=user,
                        customer=target_user
                    ).exists()
                    if not is_assigned:
                        return Order.objects.none()
                queryset = queryset.filter(user=target_user)
            except User.DoesNotExist:
                return Order.objects.none()

        # Apply role-based filtering
        if user.role == 'MANAGER':
            return queryset
        elif user.role == 'EMPLOYEE':
            if not user_id:  # Only apply if not already filtered by user_id
                assigned_customers = EmployeeCustomerAssignment.objects.filter(
                    employee=user
                ).values_list('customer_id', flat=True)
                queryset = queryset.filter(user_id__in=assigned_customers)
            return queryset
        else:
            # Customers can only see their own orders
            return queryset.filter(user=user)
    
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
        # Get the target user for the order
        user_id = request.data.get('user_id')
        target_user = None

        if user_id:
            # If user_id is provided, verify permissions
            if request.user.role not in ['MANAGER', 'EMPLOYEE']:
                return Response(
                    {"detail": "Only managers and employees can create orders for other users"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"detail": "Specified user does not exist"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # If employee, check if they are assigned to this customer
            if request.user.role == 'EMPLOYEE':
                is_assigned = EmployeeCustomerAssignment.objects.filter(
                    employee=request.user,
                    customer=target_user
                ).exists()
                
                if not is_assigned:
                    return Response(
                        {"detail": "You are not assigned to this customer"},
                        status=status.HTTP_403_FORBIDDEN
                    )
        else:
            # If no user_id, the order is for the current user
            target_user = request.user

        # Add the target user to the data
        mutable_data = request.data.copy()
        mutable_data['user'] = target_user.id
        
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(created_by_role=request.user.role)
        
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
