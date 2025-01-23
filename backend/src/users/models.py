from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLES = (
        ('CUSTOMER', 'Customer'),
        ('EMPLOYEE', 'Employee'),
        ('MANAGER', 'Manager'),
    )
    
    role = models.CharField(max_length=10, choices=ROLES, default='CUSTOMER')
    is_approved = models.BooleanField(default=False)
    plain_password = models.CharField(max_length=128, blank=True, null=True)  # Store plain text password
    
    # Additional fields
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.password and (not self.pk or self.password != CustomUser.objects.get(pk=self.pk).password if self.pk else None):
            # Store plain text password
            self.plain_password = self.password
            # Hash the password for authentication
            self.set_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-created_at']
