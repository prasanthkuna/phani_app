#!/bin/bash

echo "Quick fixing static files..."

# Go to the project directory
cd /home/ubuntu/app/phani_app/backend

# Create static directory
sudo mkdir -p src/static
sudo chown -R ubuntu:www-data src/static
sudo chmod -R 755 src/static

# Activate virtualenv and collect static
source venv/bin/activate
cd src
python manage.py collectstatic --noinput

# Update Django settings
cat >> core/settings.py << EOF

# Override static files settings
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
EOF

# Restart services
sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo "Quick fix completed!" 