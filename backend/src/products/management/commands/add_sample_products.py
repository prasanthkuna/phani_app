from django.core.management.base import BaseCommand
from products.models import Product
from decimal import Decimal

class Command(BaseCommand):
    help = 'Adds sample pesticide products to the database'

    def handle(self, *args, **kwargs):
        products = [
            {
                'name': 'RoundUp Pro',
                'description': 'Professional-grade herbicide for broad-spectrum weed control. Effective for Indian agricultural conditions.',
                'price': Decimal('1499.00'),
                'stock': 100
            },
            {
                'name': 'Malathion 50',
                'description': 'Broad-spectrum insecticide effective against various insects common in Indian crops.',
                'price': Decimal('899.00'),
                'stock': 75
            },
            {
                'name': 'Neem Oil Organic',
                'description': 'Natural pesticide derived from neem seeds. Perfect for organic farming in Indian conditions.',
                'price': Decimal('499.00'),
                'stock': 150
            },
            {
                'name': 'Copper Fungicide',
                'description': 'Controls various plant diseases in tropical conditions. Ideal for Indian agriculture.',
                'price': Decimal('699.00'),
                'stock': 85
            },
            {
                'name': 'Pyrethrin Natural',
                'description': 'Natural insecticide effective in tropical climate. Safe for Indian agricultural use.',
                'price': Decimal('799.00'),
                'stock': 60
            },
            {
                'name': 'Bacillus Thuringiensis (Bt)',
                'description': 'Biological pesticide effective against caterpillars in Indian crops.',
                'price': Decimal('449.00'),
                'stock': 120
            },
            {
                'name': 'Sulfur Dust',
                'description': 'Controls fungal diseases in Indian orchards and vineyards.',
                'price': Decimal('349.00'),
                'stock': 200
            },
            {
                'name': 'Spinosad Organic',
                'description': 'Natural insect control product safe for Indian organic farming.',
                'price': Decimal('999.00'),
                'stock': 90
            },
            {
                'name': 'Azadirachtin Extract',
                'description': 'Concentrated neem extract, traditionally used in Indian agriculture.',
                'price': Decimal('1299.00'),
                'stock': 70
            },
            {
                'name': 'Diatomaceous Earth',
                'description': 'Natural powder for pest control in Indian warehouses and storage.',
                'price': Decimal('449.00'),
                'stock': 180
            }
        ]

        for product_data in products:
            Product.objects.get_or_create(
                name=product_data['name'],
                defaults={
                    'description': product_data['description'],
                    'price': product_data['price'],
                    'stock': product_data['stock']
                }
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully added/updated product "{product_data["name"]}"')
            ) 