# Laboratory Information System

A modern, secure, and role-based **Laboratory Information System (LIS)** built for efficient management of clinical laboratory operations.

---

## ✨ Features

* 🔐 Secure Authentication using JWT
* 👥 Role-Based Access Control (Admin, Receptionist, Technician, Patient)
* 🧑‍⚕️ Patient Registration & Management
* 🧪 Laboratory Test Ordering
* 📋 Test Result Management
* 📊 Dashboard & Reporting
* 📱 Responsive and Modern User Interface
* 🗄️ PostgreSQL Database Integration
* ⚡ Full-Stack Architecture (React + Node.js + Express)

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### Authentication & Security

* JWT (JSON Web Tokens)
* bcrypt

### Additional Packages

* dotenv
* pg
* cors

---

## 🚀 Quick Start

### Prerequisites

Ensure the following are installed on your system:

* Node.js (v18 or later)
* PostgreSQL
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/TIHOR1140/GPSD-LIS.git
cd GPSD-LIS
```

---

## 2️⃣ Database Setup

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE lis_db;"
```

Run the database schema:

```bash
psql -U postgres -d lis_db -f database/schema.sql
```

Seed the database with default users:

```bash
psql -U postgres -d lis_db -f database/seed.sql
```

---

## 3️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Update the `.env` file:

```env
PORT=4000
CLIENT_URL=http://localhost:5173

JWT_SECRET=your-super-secret-jwt-key-change-in-production

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/lis_db

BCRYPT_ROUNDS=12
```
* As psw I have used rohit2004 

Start the backend server:

```bash
npm run dev
```

---

## 4️⃣ Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

---

## 🔑 Default Login Credentials

| Role         | Email                                             | Password    |
| ------------ | ------------------------------------------------- | ----------- |
| Admin        | [admin@gmail.com](mailto:admin@gmail.com)         | Admin@123   |
| Receptionist | [recep@gmail.com](mailto:recep@gmail.com)         | Recep@123   |
| Technician   | [tech@gmail.com](mailto:tech@gmail.com)           | Tech@123    |
| Patient      | [patient@gmail.com](mailto:patient@gmail.com)     | Patient@123 |

> ⚠️ **Security Notice:** Change all default passwords immediately after first login.

---

## 📁 Project Structure

```text
GPSD-LIS/
│
├── backend/          # Node.js + Express API
├── frontend/         # React.js Frontend
├── database/         # SQL Schema & Seed Files
├── docs/             # Project Documentation
└── README.md
```

---

## 🧪 How to Test

1. Start PostgreSQL.
2. Run the backend server:

```bash
cd backend
npm run dev
```

3. Run the frontend application:

```bash
cd frontend
npm run dev
```

4. Open your browser and navigate to:

```text
http://localhost:5173
```

5. Login using one of the default accounts provided above.

---

## 🔒 Security Features

* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Role-based authorization
* Environment variable configuration
* Secure database access

---
