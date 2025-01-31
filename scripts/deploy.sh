#!/bin/bash

# Navigate to app directory
cd /home/ubuntu/app

# Pull latest changes
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
cd src
python manage.py migrate
python manage.py collectstatic --noinput

# Restart gunicorn
sudo systemctl restart gunicorn

# Update frontend
cd ../../frontend
npm install
npm run build

# Restart nginx
sudo systemctl restart nginx

echo "Deployment completed successfully!" 