#!/bin/bash

# Remove default Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/default

# Copy our configuration
sudo cp scripts/nginx.conf /etc/nginx/sites-available/phani_app
sudo ln -sf /etc/nginx/sites-available/phani_app /etc/nginx/sites-enabled/

# Create necessary directories
sudo mkdir -p /home/ubuntu/app/backend/src/static
sudo mkdir -p /home/ubuntu/app/backend/src/media

# Set permissions
sudo chown -R ubuntu:www-data /home/ubuntu/app/backend/src/static
sudo chown -R ubuntu:www-data /home/ubuntu/app/backend/src/media
sudo chmod -R 755 /home/ubuntu/app/backend/src/static
sudo chmod -R 755 /home/ubuntu/app/backend/src/media

# Collect static files
cd /home/ubuntu/app/backend
source venv/bin/activate
python src/manage.py collectstatic --noinput

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx 