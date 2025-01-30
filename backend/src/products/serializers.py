from rest_framework import serializers
from .models import Product
from django.conf import settings

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock', 'created_at', 'updated_at', 'is_active', 'image', 'image_url']
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Handle image URL
        if instance.image and instance.image.url:
            ret['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        else:
            ret['image'] = None
            
        # Handle external image URL
        ret['image_url'] = instance.image_url if instance.image_url else None
        
        return ret 