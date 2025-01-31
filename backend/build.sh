#!/bin/bash
# exit on error
set -o errexit

# Make script executable
chmod +x build.sh

# Navigate to the src directory
cd src

# Install Python dependencies
pip install -r ../requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Install additional required packages
pip install gunicorn psycopg2-binary

# Create superuser
python manage.py create_superuser 