from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem
from products.serializers import ProductSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_detail', 'quantity', 'price']
        read_only_fields = ['price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_details = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'user_details', 'user_email', 'status', 'total_amount', 
                 'shipping_address', 'created_at', 'updated_at', 'items', 'payment_deadline', 'days_remaining']
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        if self.context['request'].user.role in ['MANAGER', 'EMPLOYEE']:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role,
                'phone': obj.user.phone,
                'address': obj.user.address
            }
        return None

    def get_days_remaining(self, obj):
        return obj.get_days_remaining()

class CreateOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity']

class CreateOrderSerializer(serializers.ModelSerializer):
    items = CreateOrderItemSerializer(many=True)
    user_id = serializers.IntegerField(required=False)  # Optional field for managers/employees
    payment_deadline = serializers.IntegerField(min_value=1, max_value=30, default=7)
    
    class Meta:
        model = Order
        fields = ['shipping_address', 'items', 'user_id', 'payment_deadline']
        
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context['request']
        
        # If user_id is provided and requester is manager/employee, use that user
        if 'user_id' in validated_data and request.user.role in ['MANAGER', 'EMPLOYEE']:
            try:
                user = User.objects.get(id=validated_data.pop('user_id'))
            except User.DoesNotExist:
                raise serializers.ValidationError("Specified user does not exist")
        else:
            user = request.user
        
        # Create the order
        order = Order.objects.create(
            user=user,
            **validated_data
        )
        
        total_amount = 0
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            # Check stock availability
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name}. Available: {product.stock}"
                )
            
            # Create order item
            OrderItem.objects.create(
                order=order,
                price=product.price,
                **item_data
            )
            
            # Update total amount
            total_amount += product.price * quantity
            
            # Update product stock
            product.stock -= quantity
            product.save()
        
        order.total_amount = total_amount
        order.save()
        
        return order

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total = serializers.DecimalField(source='get_total', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(source='get_total', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total'] 