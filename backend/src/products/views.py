from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_stock']:
            # Only managers can modify products
            if self.request.user.is_authenticated and self.request.user.role == 'MANAGER':
                return [permissions.IsAuthenticated()]
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.all()
        
        # Non-managers can only see active products
        if not self.request.user.is_authenticated or self.request.user.role != 'MANAGER':
            queryset = queryset.filter(is_active=True)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by stock status
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock is not None:
            if in_stock.lower() == 'true':
                queryset = queryset.filter(stock__gt=0)
            elif in_stock.lower() == 'false':
                queryset = queryset.filter(stock=0)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response(
            {"detail": "Product has been deactivated."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        product = self.get_object()
        try:
            quantity = int(request.data.get('quantity', 0))
            product.stock = max(0, product.stock + quantity)
            product.save()
            return Response({'stock': product.stock})
        except ValueError:
            return Response(
                {'error': 'Invalid quantity provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with stock below 10 units"""
        if not request.user.is_authenticated or request.user.role != 'MANAGER':
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        products = Product.objects.filter(is_active=True, stock__lt=10)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get product statistics"""
        if not request.user.is_authenticated or request.user.role not in ['MANAGER', 'EMPLOYEE']:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        total_products = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(is_active=True, stock__lt=10).count()
        out_of_stock = Product.objects.filter(is_active=True, stock=0).count()
        
        return Response({
            'total_products': total_products,
            'low_stock_products': low_stock,
            'out_of_stock': out_of_stock
        })

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
