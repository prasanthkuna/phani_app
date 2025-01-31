#!/bin/bash

# Print Ubuntu version
echo "Ubuntu version:"
lsb_release -a

# Update system and install essential packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget software-properties-common coreutils git

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
echo "Node.js version:"
node --version
echo "NPM version:"
npm --version

# Install required packages
sudo apt install -y python3-pip python3-venv postgresql nginx

# Verify Python version
echo "Python3 version:"
python3 --version

# Create directory structure and set permissions
sudo mkdir -p /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app

# Update repository
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/prasanthkuna/phani_app.git .
fi
sudo chown -R ubuntu:ubuntu /home/ubuntu/app

# Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE phani_db;
CREATE USER phani_user WITH PASSWORD 'your_db_password';
ALTER ROLE phani_user SET client_encoding TO 'utf8';
ALTER ROLE phani_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE phani_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE phani_db TO phani_user;
EOF

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
# Clear npm cache and install dependencies
npm cache clean --force
npm install
# Use npx to ensure we're using the project's TypeScript version
npx tsc -b && npm run build

# Create logs directory for gunicorn
sudo mkdir -p /var/log/gunicorn
sudo chown -R ubuntu:ubuntu /var/log/gunicorn

# Set correct permissions for the entire app directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
sudo chmod -R 755 /home/ubuntu/app

# Start services
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn 