from django.db import models
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError

def validate_image_size(value):
    filesize = value.size
    if filesize > 5242880:  # 5MB
        raise ValidationError("The maximum file size that can be uploaded is 5MB")

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    image = models.ImageField(
        upload_to='products/', 
        null=True, 
        blank=True,
        validators=[
            FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp']),
            validate_image_size
        ],
        help_text="Upload a product image (max 5MB, formats: jpg, jpeg, png, webp)"
    )
    image_url = models.URLField(max_length=500, null=True, blank=True, help_text="External image URL if no image is uploaded")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def get_image_url(self):
        if self.image:
            return self.image.url
        return self.image_url or None

    def clean(self):
        super().clean()
        if not self.image and not self.image_url:
            raise ValidationError("Either an image file or an image URL must be provided")
