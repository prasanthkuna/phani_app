#!/bin/bash

echo "Starting Django server..."

# Go to the project directory
cd /home/ubuntu/app/phani_app/backend

# Activate virtualenv
source venv/bin/activate

# Create necessary directories
cd src
mkdir -p static media
chmod -R 755 static media

# Collect static files with the new settings
DJANGO_SETTINGS_MODULE=core.local_settings python manage.py collectstatic --noinput

# Run Django server on port 80 with the new settings
sudo DJANGO_SETTINGS_MODULE=core.local_settings python manage.py runserver 0.0.0.0:80 
