from django.db import models
from django.conf import settings
from products.models import Product
from django.utils import timezone
from datetime import datetime
from users.models import CustomUser

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipping_address = models.TextField()
    payment_deadline = models.PositiveIntegerField(help_text="Number of days allowed for payment", default=7)

    # Location fields
    location_state = models.CharField(max_length=100, blank=True, default='')
    location_display_name = models.TextField(blank=True, default='')
    location_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_by_role = models.CharField(max_length=20, default='CUSTOMER')  # To track which role created the order

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

    def calculate_total(self):
        total = sum(item.quantity * item.price for item in self.items.all())
        self.total_amount = total
        return total

    def save(self, *args, **kwargs):
        if self.pk:  # If order already exists
            self.calculate_total()
        super().save(*args, **kwargs)
        if not self.pk:  # If this is a new order
            self.calculate_total()
            super().save(*args, **kwargs)

    def get_days_remaining(self):
        if self.status != 'pending':
            return 0
        deadline_date = self.created_at + timezone.timedelta(days=self.payment_deadline)
        remaining = deadline_date - timezone.now()
        days = remaining.days
        return days  # Can be negative for overdue payments

    def accept_order(self):
        self.status = 'accepted'
        self.save()

    def reject_order(self):
        self.status = 'rejected'
        self.save()

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at the time of order

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Order {self.order.id}"

    def save(self, *args, **kwargs):
        if not self.price:
            self.price = self.product.price
        super().save(*args, **kwargs)
