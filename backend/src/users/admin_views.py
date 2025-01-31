from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomUser, EmployeeCustomerAssignment
from .serializers import (
    UserManagementSerializer,
    UserStatusUpdateSerializer,
    UserRoleUpdateSerializer,
    EmployeeCustomerAssignmentSerializer,
    UserEditSerializer
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
        elif self.action in ['assign_customers', 'get_employee_customers', 'get_customer_assignments']:
            return EmployeeCustomerAssignmentSerializer
        elif self.action == 'edit_user':
            return UserEditSerializer
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
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'detail': 'New password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password has been updated successfully'
        })

    @action(detail=True, methods=['post'])
    def assign_customers(self, request, pk=None):
        """Assign customers to an employee"""
        employee = self.get_object()
        
        if employee.role != 'EMPLOYEE':
            return Response(
                {"detail": "Can only assign customers to employees"},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_ids = request.data.get('customer_ids', [])
        if not isinstance(customer_ids, list):
            return Response(
                {"detail": "customer_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )

        assignments = []
        errors = []
        
        for customer_id in customer_ids:
            try:
                customer = CustomUser.objects.get(id=customer_id, role='CUSTOMER')
                assignment = EmployeeCustomerAssignment.objects.create(
                    employee=employee,
                    customer=customer,
                    assigned_by=request.user
                )
                assignments.append(assignment)
            except CustomUser.DoesNotExist:
                errors.append(f"Customer with id {customer_id} does not exist")
            except Exception as e:
                errors.append(str(e))

        serializer = self.get_serializer(assignments, many=True)
        return Response({
            'assignments': serializer.data,
            'errors': errors
        })

    @action(detail=True, methods=['get'])
    def get_employee_customers(self, request, pk=None):
        """Get all customers assigned to an employee"""
        employee = self.get_object()
        if employee.role != 'EMPLOYEE':
            return Response(
                {"detail": "Can only get customers for employees"},
                status=status.HTTP_400_BAD_REQUEST
            )

        assignments = EmployeeCustomerAssignment.objects.filter(employee=employee)
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def get_customer_assignments(self, request, pk=None):
        """Get all employees assigned to a customer"""
        customer = self.get_object()
        if customer.role != 'CUSTOMER':
            return Response(
                {"detail": "Can only get assignments for customers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        assignments = EmployeeCustomerAssignment.objects.filter(customer=customer)
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def unassign_customer(self, request, pk=None):
        """Unassign a customer from an employee"""
        employee = self.get_object()
        
        if employee.role != 'EMPLOYEE':
            return Response(
                {"detail": "Can only unassign customers from employees"},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response(
                {"detail": "customer_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            assignment = EmployeeCustomerAssignment.objects.get(
                employee=employee,
                customer_id=customer_id
            )
            assignment.delete()
            return Response({"detail": "Customer unassigned successfully"})
        except EmployeeCustomerAssignment.DoesNotExist:
            return Response(
                {"detail": "Assignment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def unassigned_customers(self, request):
        """Get all customers who are not assigned to any employee"""
        # Get all customers
        customers = CustomUser.objects.filter(
            role='CUSTOMER',
            is_active=True,
            is_approved=True
        )
        
        # Get all assigned customer IDs
        assigned_customer_ids = EmployeeCustomerAssignment.objects.values_list(
            'customer_id', flat=True
        ).distinct()
        
        # Filter out assigned customers
        unassigned_customers = customers.exclude(id__in=assigned_customer_ids)
        
        serializer = UserManagementSerializer(unassigned_customers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def edit_user(self, request, pk=None):
        """Edit user details including password"""
        user = self.get_object()
        serializer = UserEditSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_user = serializer.save()
            # Return updated user data using UserManagementSerializer to include all fields
            response_serializer = UserManagementSerializer(updated_user)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
