from django.db import models
from django.conf import settings
from products.models import Product
from django.utils import timezone
from datetime import datetime
from users.models import CustomUser

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipping_address = models.TextField()
    payment_deadline = models.PositiveIntegerField(help_text="Number of days allowed for payment", default=7)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

    def get_days_remaining(self):
        if self.status != 'pending':
            return 0
        deadline_date = self.created_at + timezone.timedelta(days=self.payment_deadline)
        remaining = deadline_date - timezone.now()
        return max(0, remaining.days)

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
