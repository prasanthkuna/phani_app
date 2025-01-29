from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductSerializer
from users.models import CustomUser
from products.models import Product
from django.db import transaction
import logging
from shopping_cart.models import Cart

logger = logging.getLogger(__name__)

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_id', 'product_detail', 'quantity', 'price']
        read_only_fields = ['price']

    def create(self, validated_data):
        product_id = validated_data.pop('product_id')
        product = Product.objects.get(id=product_id)
        return OrderItem.objects.create(product=product, **validated_data)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_details = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_details', 'username', 'status', 'total_amount', 
            'shipping_address', 'created_at', 'updated_at', 'items', 'payment_deadline', 
            'days_remaining', 'created_by_role', 'location_state', 'location_display_name',
            'location_latitude', 'location_longitude'
        ]
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        if self.context['request'].user.role in ['MANAGER', 'EMPLOYEE']:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'role': obj.user.role,
                'phone': obj.user.phone,
                'address': obj.user.address
            }
        return None

    def get_days_remaining(self, obj):
        return obj.get_days_remaining()

class CreateOrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    
    class Meta:
        model = OrderItem
        fields = ['product_id', 'quantity']

class CreateOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user_id = serializers.IntegerField(required=False)  # Optional, for managers creating orders for customers
    location_state = serializers.CharField(required=False, allow_blank=True)
    location_display_name = serializers.CharField(required=False, allow_blank=True)
    location_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    location_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    payment_deadline = serializers.IntegerField(min_value=1, max_value=30, default=7)
    
    class Meta:
        model = Order
        fields = [
            'shipping_address', 'payment_deadline', 'items', 'user_id',
            'location_state', 'location_display_name',
            'location_latitude', 'location_longitude'
        ]

    def validate(self, data):
        if not data.get('items'):
            raise serializers.ValidationError("At least one item is required")
        
        # Validate user permissions and existence
        request = self.context['request']
        user_id = data.get('user_id')
        
        # Check if location is required (for employees and managers)
        if request.user.role in ['MANAGER', 'EMPLOYEE']:
            location_fields = [
                'location_state', 'location_display_name',
                'location_latitude', 'location_longitude'
            ]
            missing_fields = [field for field in location_fields if not data.get(field)]
            if missing_fields:
                raise serializers.ValidationError({
                    field: ["This field is required for employees and managers."]
                    for field in missing_fields
                })
        
        if user_id:
            if request.user.role not in ['MANAGER', 'EMPLOYEE']:
                raise serializers.ValidationError("Only managers and employees can create orders for other users")
            try:
                target_user = CustomUser.objects.get(id=user_id)
                if target_user.role != 'CUSTOMER':
                    raise serializers.ValidationError("Can only create orders for customers")
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Specified user does not exist")
        
        # Validate products exist
        for item in data['items']:
            try:
                product = Product.objects.get(id=item['product_id'])
                if not product.is_active:
                    raise serializers.ValidationError(f"Product {product.name} is not active")
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with id {item['product_id']} does not exist")
        
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user_id = validated_data.pop('user_id', None)
        request = self.context.get('request')
        
        # Set the user based on user_id or current user
        if user_id and request.user.role in ['MANAGER', 'EMPLOYEE']:
            user = CustomUser.objects.get(id=user_id)
        else:
            user = request.user

        # Add created_by_role
        validated_data['created_by_role'] = request.user.role
        
        # Create order
        order = Order.objects.create(user=user, **validated_data)
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order 