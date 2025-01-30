from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, EmployeeCustomerAssignment

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
        password = validated_data['password']
        user = CustomUser.objects.create_user(**validated_data)
        user.plain_password = password  # Store the plain password
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'phone', 'address')
        read_only_fields = ('id',)

class UserManagementSerializer(serializers.ModelSerializer):
    registration_date = serializers.DateTimeField(source='created_at', read_only=True)
    last_modified = serializers.DateTimeField(source='updated_at', read_only=True)
    plain_password = serializers.CharField(required=False)  # Make it not required but always returned
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'status',
            'registration_date', 'last_modified', 'phone',
            'address', 'is_active', 'plain_password'
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

class EmployeeCustomerAssignmentSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)

    class Meta:
        model = EmployeeCustomerAssignment
        fields = ['id', 'employee', 'customer', 'assigned_at', 'assigned_by',
                 'employee_username', 'customer_username', 'assigned_by_username']
        read_only_fields = ['assigned_at', 'assigned_by']

    def validate(self, attrs):
        employee = attrs.get('employee')
        customer = attrs.get('customer')
        
        if employee and employee.role != 'EMPLOYEE':
            raise serializers.ValidationError({'employee': "Selected user must be an employee"})
        
        if customer and customer.role != 'CUSTOMER':
            raise serializers.ValidationError({'customer': "Selected user must be a customer"})
        
        # Check if this assignment already exists
        if EmployeeCustomerAssignment.objects.filter(employee=employee, customer=customer).exists():
            raise serializers.ValidationError("This customer is already assigned to this employee")
        
        return attrs 

class UserEditSerializer(serializers.ModelSerializer):
    plain_password = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'role', 'status', 'phone', 'address', 'plain_password']

    def update(self, instance, validated_data):
        # Handle password update
        if 'plain_password' in validated_data:
            plain_password = validated_data.pop('plain_password')
            if plain_password:  # Only update if password is not empty
                instance._password = plain_password  # Store for save method
                instance.set_password(plain_password)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 