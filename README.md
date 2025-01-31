# Pesticides and Fertilizers Management System

A full-stack web application for managing pesticides and fertilizers business operations.

## Tech Stack

### Backend
- Django 5.0
- Django REST Framework
- SQLite Database
- Custom User Authentication
- QR Code Generation for Payments

### Frontend
- React with TypeScript
- Vite
- Shadcn UI Components
- React Router DOM
- Axios for API calls
- Context API for state management

## Features

1. User Management
   - Custom user model with role-based access
   - Authentication system
   - User profiles

2. Product Management
   - Product catalog
   - Image management
   - Stock tracking

3. Order Management
   - Order creation and tracking
   - Status updates
   - Location tracking

4. Payment System
   - UPI payment integration
   - QR code generation
   - Payment reminders

5. Sales Reporting
   - Basic reporting system
   - Sales tracking

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker and Docker Compose

### Running with Docker

1. Clone the repository
2. Start the containers:
   ```bash
   docker-compose up --build
   ```
3. Access the applications:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - Admin interface: http://localhost:8000/admin

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cd src
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## EC2 Deployment Instructions

### 1. Create EC2 Instance
1. Go to AWS Console > EC2
2. Launch a new instance:
   - Choose Ubuntu Server 22.04 LTS
   - Select t2.micro (free tier)
   - Create or select a key pair
   - Configure Security Group:
     - Allow SSH (Port 22)
     - Allow HTTP (Port 80)
     - Allow HTTPS (Port 443)

### 2. Configure Environment
1. Copy your EC2 instance's public IP
2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your values:
   - Set EC2_PUBLIC_IP to your instance's public IP
   - Set secure passwords for DB and Django

### 3. Deploy to EC2
1. SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

2. Clone and setup:
```bash
cd /home/ubuntu
git clone https://github.com/prasanthkuna/phani_app.git app
cd app
chmod +x scripts/*.sh
./scripts/setup_ec2.sh
./scripts/setup_nginx.sh
```

### 4. Future Deployments
To deploy new changes:
```bash
./scripts/deploy.sh
```

## Project Structure
```
├── backend/
│   ├── src/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
├── scripts/
│   ├── setup_ec2.sh
│   ├── setup_nginx.sh
│   ├── deploy.sh
│   └── nginx.conf
├── .env.example
└── README.md
``` 