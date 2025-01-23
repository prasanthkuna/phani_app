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
source venv/Scripts/activate  # Windows
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