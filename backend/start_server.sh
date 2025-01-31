#!/bin/bash

# Kill any existing process using port 8080
kill $(lsof -t -i:8080) 2>/dev/null || true

# Navigate to the src directory
cd src

# Start the Django server
nohup python manage.py runserver 0.0.0.0:8080 > ../django.log 2>&1 &

echo "Django server started on port 8080. Check django.log for output."
echo "To stop the server, run: kill \$(lsof -t -i:8080)" 