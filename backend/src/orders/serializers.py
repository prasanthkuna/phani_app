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
        fields = ['id', 'user', 'user_details', 'username', 'status', 'total_amount', 
                 'shipping_address', 'created_at', 'updated_at', 'items', 'payment_deadline', 'days_remaining']
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
    items = CreateOrderItemSerializer(many=True)
    user_id = serializers.IntegerField(required=False, allow_null=True)
    payment_deadline = serializers.IntegerField(min_value=1, max_value=30, default=7)
    
    class Meta:
        model = Order
        fields = ['shipping_address', 'items', 'user_id', 'payment_deadline']

    def validate(self, data):
        if not data.get('items'):
            raise serializers.ValidationError("At least one item is required")
        
        # Validate user permissions and existence
        request = self.context['request']
        user_id = data.get('user_id')
        
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
        request = self.context['request']
        items_data = validated_data.pop('items')
        user_id = validated_data.pop('user_id', None)
        
        # Get the user for the order
        try:
            order_user = CustomUser.objects.get(id=user_id) if user_id else request.user
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        
        with transaction.atomic():
            # Create order first
            order = Order.objects.create(
                user=order_user,
                total_amount=0,  # Will update after adding items
                **validated_data
            )
            
            total_amount = 0
            # Process each item
            for item_data in items_data:
                # Get and lock product
                try:
                    product = Product.objects.select_for_update().get(id=item_data['product_id'])
                except Product.DoesNotExist:
                    raise serializers.ValidationError(f"Product with id {item_data['product_id']} does not exist")
                
                # Validate stock
                if product.stock < item_data['quantity']:
                    raise serializers.ValidationError(
                        f"Not enough stock for {product.name}. Available: {product.stock}"
                    )
                
                # Create order item with current product price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item_data['quantity'],
                    price=product.price  # Set the current product price
                )
                
                # Update product stock
                product.stock -= item_data['quantity']
                product.save()
                
                # Add to total using the current product price
                total_amount += product.price * item_data['quantity']
            
            # Update order total
            order.total_amount = total_amount
            order.save()
            
            # Clear user's cart
            try:
                Cart.objects.filter(user=order_user).delete()
            except Exception as e:
                # Log the error but don't fail the order creation
                logger.error(f"Error clearing cart: {str(e)}")
            
            return order 