#!/bin/bash

# Copy Nginx configuration
sudo cp /home/ubuntu/app/scripts/nginx.conf /etc/nginx/sites-available/phani_app

# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/phani_app /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx 