from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLES = (
        ('CUSTOMER', 'Customer'),
        ('EMPLOYEE', 'Employee'),
        ('MANAGER', 'Manager'),
    )
    
    STATUS = (
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('BLOCKED', 'Blocked'),
    )
    
    role = models.CharField(max_length=10, choices=ROLES, default='CUSTOMER')
    status = models.CharField(max_length=10, choices=STATUS, default='PENDING')
    is_approved = models.BooleanField(default=False)  # Keeping for backward compatibility
    plain_password = models.CharField(max_length=128, blank=True, null=True)  # Store plain text password
    
    # Additional fields
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Fix field clashes with related_name
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )

    def save(self, *args, **kwargs):
        # Store plain password before hashing if it's being set
        if 'password' in kwargs:
            self.plain_password = kwargs['password']
        elif hasattr(self, '_password'):
            self.plain_password = self._password

        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        self.plain_password = raw_password  # Store the plain password
        super().set_password(raw_password)  # Hash the password

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-created_at']

class EmployeeCustomerAssignment(models.Model):
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='assigned_customers')
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='assigned_to_employee')
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='customer_assignments')

    class Meta:
        unique_together = ('employee', 'customer')
        ordering = ['-assigned_at']

    def clean(self):
        if self.employee.role != 'EMPLOYEE':
            raise models.ValidationError("The employee user must have the role 'EMPLOYEE'")
        if self.customer.role != 'CUSTOMER':
            raise models.ValidationError("The customer user must have the role 'CUSTOMER'")
        if self.assigned_by and self.assigned_by.role != 'MANAGER':
            raise models.ValidationError("Only managers can assign customers to employees")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.username} assigned to {self.employee.username}"
