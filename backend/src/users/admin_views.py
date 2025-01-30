from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomUser
from .serializers import (
    UserManagementSerializer,
    UserStatusUpdateSerializer,
    UserRoleUpdateSerializer
)
import django_filters

class IsManagerPermission(IsAuthenticated):
    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        return is_authenticated and request.user.role == 'MANAGER'

class UserFilter(django_filters.FilterSet):
    start_date = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    end_date = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = CustomUser
        fields = ['role', 'status', 'start_date', 'end_date']

class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsManagerPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UserFilter
    search_fields = ['username', 'email', 'phone']
    ordering_fields = ['created_at', 'username', 'role', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'update_status':
            return UserStatusUpdateSerializer
        elif self.action == 'update_role':
            return UserRoleUpdateSerializer
        return self.serializer_class

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        # Generate a random password
        new_password = CustomUser.objects.make_random_password()
        user.set_password(new_password)
        user.save()
        
        # In a real application, you would send this password via email
        # For now, we'll return it in the response (not secure for production)
        return Response({
            'message': 'Password has been reset',
            'temp_password': new_password  # In production, send via email instead
        })
