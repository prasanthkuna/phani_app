from django.core.management.base import BaseCommand
from products.models import Product
from decimal import Decimal

class Command(BaseCommand):
    help = 'Adds sample pesticide products to the database'

    def handle(self, *args, **kwargs):
        products = [
            {
                'name': 'RoundUp Pro',
                'description': 'Professional-grade herbicide for broad-spectrum weed control. Effective against most annual and perennial weeds.',
                'price': Decimal('49.99'),
                'stock': 100
            },
            {
                'name': 'Malathion 50',
                'description': 'Broad-spectrum insecticide effective against various insects including aphids, spider mites, and scales.',
                'price': Decimal('34.99'),
                'stock': 75
            },
            {
                'name': 'Neem Oil Organic',
                'description': 'Natural pesticide derived from neem seeds. Safe for organic farming and effective against various pests.',
                'price': Decimal('19.99'),
                'stock': 150
            },
            {
                'name': 'Copper Fungicide',
                'description': 'Controls various plant diseases including powdery mildew, downy mildew, and black spot.',
                'price': Decimal('24.99'),
                'stock': 85
            },
            {
                'name': 'Pyrethrin Natural',
                'description': 'Natural insecticide derived from chrysanthemum flowers. Fast-acting against flying and crawling insects.',
                'price': Decimal('29.99'),
                'stock': 60
            },
            {
                'name': 'Bacillus Thuringiensis (Bt)',
                'description': 'Biological pesticide effective against caterpillars and other leaf-eating insects.',
                'price': Decimal('15.99'),
                'stock': 120
            },
            {
                'name': 'Sulfur Dust',
                'description': 'Controls fungal diseases and mites. Commonly used in orchards and vineyards.',
                'price': Decimal('12.99'),
                'stock': 200
            },
            {
                'name': 'Spinosad Organic',
                'description': 'Natural insect control product effective against various pests while being safe for beneficial insects.',
                'price': Decimal('39.99'),
                'stock': 90
            },
            {
                'name': 'Azadirachtin Extract',
                'description': 'Concentrated neem extract that acts as an insect growth regulator and antifeedant.',
                'price': Decimal('44.99'),
                'stock': 70
            },
            {
                'name': 'Diatomaceous Earth',
                'description': 'Natural powder that controls crawling insects through physical action. Safe for food storage areas.',
                'price': Decimal('16.99'),
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