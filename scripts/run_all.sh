#!/bin/bash

echo "Starting both Frontend and Backend servers..."

# Go to the project directory
cd /home/ubuntu/app/phani_app

# Start Backend
echo "Starting Backend on port 8080..."
cd backend
source venv/bin/activate
cd src
DJANGO_SETTINGS_MODULE=core.local_settings python manage.py runserver 0.0.0.0:8080 &

# Start Frontend
echo "Starting Frontend on port 80..."
cd ../../frontend
npm install
npm run dev -- --host 0.0.0.0 --port 8081

# Note: The frontend will run in the foreground, backend in background
# To stop both, press Ctrl+C and then run: pkill -f runserver 
