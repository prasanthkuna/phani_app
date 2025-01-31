#!/bin/bash

echo "Fixing backend setup..."

# Navigate to the backend directory
cd /home/ubuntu/app/backend

# Activate virtual environment
source venv/bin/activate

# Create necessary directories
sudo mkdir -p src/staticfiles
sudo mkdir -p src/media

# Set correct permissions
sudo chown -R ubuntu:www-data src/staticfiles
sudo chown -R ubuntu:www-data src/media
sudo chmod -R 755 src/staticfiles
sudo chmod -R 755 src/media

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

# Restart Gunicorn
sudo systemctl restart gunicorn

# Restart Nginx
sudo systemctl restart nginx

echo "Backend setup fixed!" 