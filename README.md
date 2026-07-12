# TransitOps — Smart Transport Operations Platform

TransitOps is a comprehensive, validation-first fleet management and dispatch platform designed for seamless operations, driver safety, and analytical insights.

## Tech Stack

- **Database:** PostgreSQL
- **Backend:** Node.js, Express, Prisma ORM
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Authentication:** Custom JWT + bcrypt password hashing with server-side Role-Based Access Control (RBAC)
- **Charts:** Recharts

## Setup Steps

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file (copy from root `.env.example` or backend `.env.example`):
   ```bash
   cp ../.env.example .env
   ```
4. Run database migrations and seed default users/data:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Default Login Credentials

Use the following pre-seeded credentials to test the application for each of the 4 roles:

| Role | Email | Password | Allowed Access Summary |
| --- | --- | --- | --- |
| **Fleet Manager** | `manager@transitops.com` | `Password123` | Fleet Registry (Edit), Drivers (View), Maintenance (Edit) |
| **Dispatcher** | `dispatcher@transitops.com` | `Password123` | Trips (Edit), Drivers (View) |
| **Safety Officer** | `safety@transitops.com` | `Password123` | Drivers (Edit), Trips (View) |
| **Financial Analyst** | `analyst@transitops.com` | `Password123` | Fuel & Expenses (Edit), Fleet (View), Analytics (View) |

---

## Dashboard Screenshot

*A screenshot of the dashboard will be included here once the application is running.*

---

## Documentation Links

- [ER Diagram](file:///Users/snehapatel/Library/CloudStorage/GoogleDrive-sneha.dipan.dec2005@gmail.com/My%20Drive/TransitOps/documents/er-diagram.md)
- [API Reference](file:///Users/snehapatel/Library/CloudStorage/GoogleDrive-sneha.dipan.dec2005@gmail.com/My%20Drive/TransitOps/documents/api-reference.md)
- [Decisions & Assumptions Log](file:///Users/snehapatel/Library/CloudStorage/GoogleDrive-sneha.dipan.dec2005@gmail.com/My%20Drive/TransitOps/documents/decisions.md)
