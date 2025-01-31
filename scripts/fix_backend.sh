#!/bin/bash

echo "Fixing backend setup..."

# Debug: Print current directory
pwd
echo "Listing directory contents:"
ls -la /home/ubuntu/app

# Navigate to the correct directory (note: phani_app is the actual directory name)
cd /home/ubuntu/app/phani_app/backend

# Debug: Print current directory after cd
pwd
echo "Listing backend directory contents:"
ls -la

# Activate virtual environment
source venv/bin/activate

# Create necessary directories
sudo mkdir -p src/staticfiles
sudo mkdir -p src/media

# Set correct permissions for all backend directories
sudo chown -R ubuntu:www-data .
sudo chmod -R 755 .
sudo chown -R ubuntu:www-data src/staticfiles
sudo chown -R ubuntu:www-data src/media
sudo chmod -R 755 src/staticfiles
sudo chmod -R 755 src/media

# Debug: Check manage.py location and permissions
echo "Checking manage.py:"
ls -la src/manage.py

# Collect static files
python src/manage.py collectstatic --noinput --clear

# Create .env file with necessary settings
cat > src/.env << EOF
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-secret-key-here
EC2_PUBLIC_IP=13.203.103.182
DB_NAME=phani_db
DB_USER=phani_user
DB_PASSWORD=phani5678
DB_HOST=localhost
DB_PORT=5432
EOF

# Set proper permissions for .env file
chmod 600 src/.env

# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Nginx
sudo systemctl restart nginx

echo "Backend setup fixed!" 