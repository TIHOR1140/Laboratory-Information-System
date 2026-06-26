# Module 1: Authentication and User Management

## Overview

This module provides secure authentication, patient registration, RBAC, and foundational user management for the Laboratory Information System.

## Included

- Login and patient registration screens
- JWT-based authentication
- Role-based route protection
- Admin user management workflow
- Patient profile and password update flows
- PostgreSQL schema for users, patients, and audit logs

## Data Storage

- Authentication data lives in [database/schema.sql](../database/schema.sql) under the `users` table.
- Personal details such as phone, date of birth, emergency contact, and address live in the linked `user_profiles` table.
- Audit events live in the `audit_logs` table.

## Local Credentials

- Seeded admin email: admin@lis.local
- Seeded admin password: Admin@12345

## Setup

1. Create the database schema from [database/schema.sql](../database/schema.sql).
2. Copy [backend/.env.example](../backend/.env.example) to [backend/.env](../backend/.env) and set `DATABASE_URL` plus a strong `JWT_SECRET`. The local development template now targets the `lis_db` PostgreSQL database.
3. Copy [frontend/.env.example](../frontend/.env.example) to [frontend/.env](../frontend/.env) if you want to override the API base URL.
4. Install dependencies in `backend` and `frontend`.
5. Start the backend on port `4000` and the frontend on port `5173`.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/change-password`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id/status`