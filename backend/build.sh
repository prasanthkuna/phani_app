#!/usr/bin/env bash
# exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Install additional required packages
pip install gunicorn psycopg2-binary

# Run migrations
cd src
python manage.py collectstatic --no-input
python manage.py migrate 