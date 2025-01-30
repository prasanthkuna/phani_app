from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'password', 'password2', 'email', 'role', 'phone', 'address')
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
            'address': {'required': False}
        }

    def validate_email(self, value):
        if value and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'phone', 'address')
        read_only_fields = ('id',)

class UserManagementSerializer(serializers.ModelSerializer):
    registration_date = serializers.DateTimeField(source='created_at', read_only=True)
    last_modified = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'status',
            'registration_date', 'last_modified', 'phone',
            'address', 'is_active'
        ]
        read_only_fields = ['id', 'registration_date', 'last_modified']

class UserStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['status']

class UserRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['role']

    def validate_role(self, value):
        if value not in [role[0] for role in CustomUser.ROLES]:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {', '.join([role[0] for role in CustomUser.ROLES])}")
        return value 