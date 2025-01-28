from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from users.models import CustomUser
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer
    queryset = Cart.objects.all()

    def get_queryset(self):
        # Managers and employees can access any cart
        if self.request.user.role in ['MANAGER', 'EMPLOYEE']:
            return Cart.objects.all()
        # Customers can only access their own cart
        return Cart.objects.filter(user=self.request.user)

    def get_cart_user(self):
        # First check if the user is authenticated
        if not self.request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated")

        # Get user_id from query params for managers/employees
        user_id = self.request.query_params.get('user_id')
        if user_id:
            # Only managers and employees can access other users' carts
            if self.request.user.role not in ['MANAGER', 'EMPLOYEE']:
                raise serializers.ValidationError("You do not have permission to access this cart")
            try:
                user = CustomUser.objects.get(id=user_id)
                # Verify that the user exists and is active
                if not user.is_active:
                    raise serializers.ValidationError("Specified user is not active")
                return user
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Specified user does not exist")
            except ValueError:
                raise serializers.ValidationError("Invalid user ID format")
        
        # For regular users, return their own user object
        return self.request.user

    def get_or_create_cart(self):
        try:
            user = self.get_cart_user()
            
            # Ensure user exists and is active
            if not user.is_active:
                raise serializers.ValidationError("User is not active")
            
            # Use get_or_create to handle race conditions
            cart, created = Cart.objects.get_or_create(user=user)
            return cart
            
        except serializers.ValidationError as e:
            # Re-raise validation errors
            raise e
        except Exception as e:
            # Handle any other unexpected errors
            if 'FOREIGN KEY constraint failed' in str(e):
                raise serializers.ValidationError("Unable to create cart: User does not exist")
            raise serializers.ValidationError(f"Error creating cart: {str(e)}")

    def list(self, request):
        try:
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            cart = self.get_or_create_cart()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except serializers.ValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving cart: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        try:
            cart = self.get_or_create_cart()
            serializer = CartItemSerializer(data=request.data)
            
            if serializer.is_valid():
                product_id = serializer.validated_data['product_id']
                quantity = serializer.validated_data.get('quantity', 1)
                
                # Use get_or_create to handle race conditions
                cart_item, created = CartItem.objects.get_or_create(
                    cart=cart,
                    product_id=product_id,
                    defaults={'quantity': quantity}
                )
                
                if not created:
                    # If item exists, update quantity
                    cart_item.quantity += quantity
                    cart_item.save()
                
                # Return updated cart data
                cart_serializer = self.get_serializer(cart)
                return Response(cart_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Error processing cart item: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        try:
            cart = self.get_or_create_cart()
            product_id = request.data.get('product_id')
            quantity = request.data.get('quantity', 1)
            
            try:
                cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                if quantity <= 0:
                    cart_item.delete()
                else:
                    cart_item.quantity = quantity
                    cart_item.save()
                
                cart_serializer = self.get_serializer(cart)
                return Response(cart_serializer.data)
            except CartItem.DoesNotExist:
                return Response(
                    {'detail': 'Item not found in cart'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except serializers.ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Error updating cart item: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        try:
            cart = self.get_or_create_cart()
            product_id = request.data.get('product_id')
            
            try:
                cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                cart_item.delete()
                cart_serializer = self.get_serializer(cart)
                return Response(cart_serializer.data)
            except CartItem.DoesNotExist:
                return Response(
                    {'detail': 'Item not found in cart'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except serializers.ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Error removing cart item: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def clear(self, request):
        try:
            cart = self.get_or_create_cart()
            cart.items.all().delete()
            cart_serializer = self.get_serializer(cart)
            return Response(cart_serializer.data)
        except serializers.ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Error clearing cart: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
