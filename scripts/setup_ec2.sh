#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip python3-venv nodejs npm postgresql nginx

# Setup PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE phani_db;"
sudo -u postgres psql -c "CREATE USER phani_user WITH PASSWORD 'your_db_password';"
sudo -u postgres psql -c "ALTER ROLE phani_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE phani_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE phani_user SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE phani_db TO phani_user;"

# Create directory structure
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Clone repository
git clone https://github.com/prasanthkuna/phani_app.git .

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create gunicorn service
sudo tee /etc/systemd/system/gunicorn.service << EOF
[Unit]
Description=Gunicorn daemon for Django Project
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/app/backend/src
ExecStart=/home/ubuntu/app/backend/venv/bin/gunicorn --config /home/ubuntu/app/backend/gunicorn_config.py core.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Setup frontend
cd ../frontend
npm install
npm run build

# Create logs directory for gunicorn
sudo mkdir -p /var/log/gunicorn
sudo chown -R ubuntu:ubuntu /var/log/gunicorn

# Start services
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn 