# POS Retail Application

A production-grade, scalable Point of Sale (POS) application built with Vue 3, Node.js (Express), and PostgreSQL. Optimized for modern retail and thermal printing environments.

## Features

- **Store Dashboard**: Real-time sales overview with advanced analytics.
    - **Category Analysis**: Visualization of sales distribution by product category.
    - **Hourly & Monthly Revenue**: Track performance trends across different time periods.
- **POS Interface**: High-performance cashier interface.
    - Fast product search by name, SKU, or barcode.
    - Professional cart management.
    - Integrated checkout flow for Cash and QRIS payments.
- **Production-Grade Receipt Printing**:
    - Support for **58mm** and **80mm** commercial thermal printers.
    - Isolated "Safe Print" engine to prevent UI interference on paper.
    - Integrated **QR Code** for digital receipt tracking.
    - Monospace branding optimized for thermal heads.
- **Product Management**: Robust CRUD system for products and categories.
- **Inventory & Stock Logs**: Comprehensive tracking of inventory movements.
    - Specialized **IN**/**OUT** logging for better visual distinction.
    - Accurate stock updates upon transaction completion.
- **Authentication**: Secure JWT-based login with role-based access control.

## Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API + Typescript)
- **State Management**: Pinia
- **Styling**: TailwindCSS
- **Icons**: Lucide-Vue-Next
- **Visualization**: ApexCharts

### Backend
- **Framework**: Node.js + Express (Clean Architecture / Modular Design)
- **Database ORM**: Prisma
- **Database**: PostgreSQL (Prisma-Migrate)
- **Architecture**: Domain-driven modular structure in `src/modules`.

## Prerequisites

- Node.js (v18+)
- PostgreSQL Database (v14+)

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
npm.cmd run dev
# App running on http://localhost:5173
```

## Admin Credentials (Seeded)

- **Email**: admin@example.com
- **Password**: admin123

## Achievement Status

- [x] Backend API (Modular Clean Architecture)
- [x] Refined Analytical Dashboard (Category, Time, Month)
- [x] Production-Grade Thermal Receipt Engine (5mm/80mm)
- [x] Integrated QR Code Support
- [x] Advanced Stock Movement Logging (IN/OUT Distinction)
- [x] POS Transaction Logic (Cash & QRIS)
- [x] Authentication & Role-Based Access
