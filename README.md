# Laboratory Information System (LIS)

A modern, secure, and role-based **Laboratory Information System (LIS)** built for efficient management of clinical laboratory operations, test directories, and patient reporting.

---

## ✨ Key Features & Enhancements

* 🔐 **Secure Authentication**: JWT-based authorization and backend verification.
* 👥 **Role-Based Access Control**: Structured layouts for Admins, Receptionists, Technicians, and Patients.
* ⚡ **Real-Time Status Updates (WebSockets)**: Uses **Socket.io** to synchronize technician test submissions with receptionist screens and patient tables instantly.
* 🌙 **Persistent Dark Mode Toggle**: Responsive Sun/Moon header toggle with `localStorage` selection, utilizing Tailwind CSS variants.
* 🛡️ **Security & Session Control**: Admin command center to audit active user sessions (logins, IP addresses, browser strings) and trigger immediate remote session revocation.
* 📊 **Live Activity Logs**: Comprehensive audit trail browser showing system-wide database logs and operator credentials.
* 📋 **Diagnostic Reports**: Dynamic PDF reports compilation and barcode generation/scanning.

---

## 🛠️ Tech Stack

### Frontend
* React.js
* Vite
* Tailwind CSS
* Lucide React Icons
* Socket.io-client

### Backend
* Node.js
* Express.js
* Socket.io
* Speakeasy (2FA integration ready)
* Nodemail / SMTP

### Database
* PostgreSQL

---

## 🚀 Quick Start

### Prerequisites
* Node.js (v18 or later)
* PostgreSQL database instance running locally

---

## 1️⃣ Database Setup & Automated Migrations

Ensure PostgreSQL is running. We have built an automated setup utility:
1. Configure credentials inside your `.env` (see backend configuration below).
2. From the project root, run:

```bash
cd backend
npm run db:setup
```
This script handles database verification, migration schema setup, and user seeding automatically!

---

## 2️⃣ Backend Configuration

Navigate to the `backend/` directory:
```bash
cd backend
```

Create a `.env` file (based on `.env.example`) containing:
```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Local PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lis_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/lis_db

# Security & Tokens
JWT_SECRET=YOUR_JWT_SECRET_KEY_MIN_32_CHARS
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12

# Gmail SMTP Email Server Config
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

Start the backend server in development mode:
```bash
npm run dev
```
*(The API will start listening on port 5000).*

---

## 3️⃣ Frontend Configuration

Open a new terminal window and navigate to the `frontend/` directory:
```bash
cd frontend
```

Install modules and run the Vite client:
```bash
npm install
npm run dev
```
*(Vite client runs on `http://localhost:5173` and proxies `/api` to port 5000).*

---

## 🔑 Default Login Credentials

| Role         | Email              | Password    |
| ------------ | ------------------ | ----------- |
| Admin        | admin@gmail.com    | Admin@123   |
| Receptionist | recep@gmail.com    | Recep@123   |
| Technician   | tech@gmail.com     | Tech@123    |
| Patient      | patient@gmail.com  | Patient@123 |

> ⚠️ **Security Notice:** Change default credentials immediately upon production deployments.
