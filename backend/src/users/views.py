from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import login, logout, authenticate
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import UserSerializer, UserUpdateSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser
import logging
from django.db.models import Count, Sum
from orders.models import Order
from products.models import Product

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(request):
    """
    This endpoint is used to set the CSRF cookie.
    The frontend will call this before making any POST/PUT/DELETE requests.
    """
    return Response({'detail': 'CSRF cookie set'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_check(request):
    """
    This endpoint is used to check if the user's session is still valid.
    """
    return Response({
        'isValid': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def register_view(request):
    """
    Registration view that creates a new user
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'detail': 'Account created successfully. You can login once your account is approved by an administrator.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def login_view(request):
    """
    Login view that sets CSRF cookie and handles authentication
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'detail': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        if not user.is_approved:
            return Response(
                {'detail': 'Your account has not been approved yet. Please wait for admin approval.'},
                status=status.HTTP_403_FORBIDDEN
            )
        login(request, user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        })
    return Response(
        {'detail': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def logout_view(request):
    """
    Logout view that handles user logout
    """
    logout(request)
    return Response({'detail': 'Successfully logged out'})

@method_decorator(ensure_csrf_cookie, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return UserSerializer
        return UserUpdateSerializer

    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            return Response({
                'detail': 'Account created successfully. You can login once your account is approved by an administrator.',
                'user': response.data
            }, status=status.HTTP_201_CREATED)
        return response

    @action(detail=False, methods=['get'])
    def get_customers(self, request):
        """Get customers based on user role"""
        user = request.user
        
        # Base queryset for active and approved customers
        queryset = CustomUser.objects.filter(
            role='CUSTOMER',
            is_active=True,
            is_approved=True
        )
        
        # If user is employee, only return their assigned customers
        if user.role == 'EMPLOYEE':
            from .models import EmployeeCustomerAssignment
            assigned_customer_ids = EmployeeCustomerAssignment.objects.filter(
                employee=user
            ).values_list('customer_id', flat=True)
            queryset = queryset.filter(id__in=assigned_customer_ids)
        # For managers, return all customers
        elif user.role != 'MANAGER':
            return Response(
                {"detail": "You do not have permission to view customers."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserUpdateSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = UserUpdateSerializer(request.user)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        logger.debug(f"List method called by user: {request.user.username}")
        logger.debug(f"Request headers: {request.headers}")
        logger.debug(f"Query params: {request.query_params}")
        
        # Allow managers and employees to list customers
        if request.user.role not in ['MANAGER', 'EMPLOYEE']:
            logger.debug(f"Permission denied: user role is {request.user.role}")
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get base queryset
        queryset = CustomUser.objects.filter(is_active=True)
        logger.debug(f"Base queryset count: {queryset.count()}")
        
        # Filter by role if specified
        role = request.query_params.get('role')
        if role:
            logger.debug(f"Filtering by role: {role}")
            if role.upper() == 'CUSTOMER':
                # For customers, ensure they are approved
                queryset = queryset.filter(
                    role__in=['CUSTOMER', 'Customer', 'customer'],
                    is_approved=True
                )
                logger.debug(f"Approved customers count: {queryset.count()}")
                logger.debug(f"SQL Query: {queryset.query}")
            else:
                # For other roles, just filter by role
                queryset = queryset.filter(role__iexact=role)
                logger.debug(f"Users with role {role} count: {queryset.count()}")
        
        # Log the results
        logger.debug(f"Final queryset count: {queryset.count()}")
        logger.debug(f"Found users: {[f'{user.username} ({user.role})' for user in queryset]}")
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        if request.user.role != 'MANAGER':
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all active users
        total_users = CustomUser.objects.filter(is_active=True).count()
        
        # Get pending approval users (active users that are not approved)
        pending_approval = CustomUser.objects.filter(
            is_active=True,
            is_approved=False
        ).count()
        
        return Response({
            'total_users': total_users,
            'pending_approval': pending_approval
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """Get statistics for the authenticated user."""
    user = request.user
    
    # Get order stats
    orders = Order.objects.filter(user=user)
    total_orders = orders.count()
    total_spent = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    # Get product stats if user is staff
    total_products = 0
    if user.is_staff:
        total_products = Product.objects.count()
    
    return Response({
        'total_orders': total_orders,
        'total_spent': total_spent,
        'total_products': total_products,
    })
