# POS Retail Application

A modern, scalable Point of Sale (POS) application built with Vue 3, Node.js, Express, and PostgreSQL.

## Features

- **Store Dashboard**: Overview of sales and inventory.
- **POS Interface**: Fast cashier interface with product search, cart management, and checkout.
- **Product Management**: CRUD operations for products and categories.
- **Inventory Management**: Track stock movements and adjustments.
- **Transaction History**: View past transactions.
- **Authentication**: JWT-based login with role-based access control (Admin/Cashier).

## Tech Stack

- **Frontend**: Vue 3, Vite, Pinia, TailwindCSS
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Database**: PostgreSQL

## Prerequisites

- Node.js (v18+)
- PostgreSQL Database

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
# Edit .env with your database credentials
```

Initialize Database:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the Server:
```bash
npm run dev
# OR if you encounter execution policy errors on Windows:
npm.cmd run dev
# Server running on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start Development Server:
```bash
npm run dev
# OR if you encounter execution policy errors on Windows:
npm.cmd run dev
# App running on http://localhost:5173
```

## Admin Credentials ( Seeded )

- **Email**: admin@example.com
- **Password**: admin123

## Checkpoints

- [x] Backend API (Express + Prisma)
- [x] Database Schema (PostgreSQL)
- [x] Frontend UI (Vue 3 + Tailwind)
- [x] Authentication Flow
- [x] POS Transaction Logic
