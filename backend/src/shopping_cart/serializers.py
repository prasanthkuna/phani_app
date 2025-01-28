from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductSerializer
from products.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    total = serializers.DecimalField(source='get_total', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
            if not product.is_active:
                raise serializers.ValidationError("This product is not available")
            if product.stock <= 0:
                raise serializers.ValidationError("This product is out of stock")
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")

    def validate(self, data):
        try:
            product = Product.objects.get(id=data['product_id'])
            quantity = data.get('quantity', 1)
            if product.stock < quantity:
                raise serializers.ValidationError(f"Not enough stock. Available: {product.stock}")
            return data
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(source='get_total', read_only=True, max_digits=10, decimal_places=2)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'username', 'items', 'total', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 