# TransitOps Backend

Express + Prisma + PostgreSQL REST API for the TransitOps fleet management platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running locally)

## Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy and configure environment
cp ../.env.example .env
# Edit .env — set DATABASE_URL to your postgres user:
# postgresql://<your_mac_username>@localhost:5432/transitops?schema=public

# 3. Create the database
psql -U <your_mac_username> postgres -c "CREATE DATABASE transitops;"

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed the database (creates 4 users, 5 vehicles, 4 drivers + sample data)
node prisma/seed.js

# 6. Start the dev server
npm run dev
# → API running on http://localhost:5001
```

> ⚠️ **macOS users:** Port 5000 is taken by Control Center. The default is already set to **5001**.

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (all 8 models)
│   ├── migrations/            # Auto-generated SQL migrations
│   └── seed.js                # Idempotent seed script
├── src/
│   ├── middlewares/
│   │   ├── auth.js            # JWT verification
│   │   ├── rbac.js            # requireRole() factory
│   │   ├── validate.js        # Zod body/query validation
│   │   └── errorHandler.js    # Centralized error mapping
│   ├── services/              # Business logic (all 10 rules here)
│   │   ├── authService.js
│   │   ├── vehicleService.js
│   │   ├── driverService.js
│   │   ├── tripService.js     # Core dispatch rules (Rules 2–8)
│   │   ├── maintenanceService.js  # Rules 9–10
│   │   ├── fuelService.js
│   │   ├── expenseService.js
│   │   ├── analyticsService.js
│   │   └── settingsService.js
│   ├── controllers/           # Thin HTTP layer (calls service, res.json)
│   ├── routes/                # Express routers with auth + RBAC middleware
│   └── utils/
│       ├── prismaClient.js    # Singleton Prisma client
│       ├── jwtUtils.js        # sign/verify helpers
│       └── pagination.js      # skip/take/meta helper
└── server.js                  # Express app entry point
```

## API

See [`documents/api-reference.md`](../documents/api-reference.md) for the full endpoint reference.

**Base URL:** `http://localhost:5001/api`

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | manager@transitops.com | Password123 |
| Dispatcher | dispatcher@transitops.com | Password123 |
| Safety Officer | safety@transitops.com | Password123 |
| Financial Analyst | analyst@transitops.com | Password123 |

## Business Rules Enforced Server-Side

| Rule | Endpoint | Guard |
|---|---|---|
| #2 Vehicle available | `PATCH /trips/:id/dispatch` | VEHICLE_UNAVAILABLE |
| #3 Driver available | `PATCH /trips/:id/dispatch` | DRIVER_SUSPENDED / LICENSE_EXPIRED |
| #4 Not already on trip | `PATCH /trips/:id/dispatch` | VEHICLE_ON_TRIP / DRIVER_ON_TRIP |
| #5 Cargo ≤ capacity | `PATCH /trips/:id/dispatch` | CAPACITY_EXCEEDED |
| #6 Status → ON_TRIP | `PATCH /trips/:id/dispatch` | Atomic transaction |
| #7 Status → AVAILABLE | `PATCH /trips/:id/complete` | Atomic transaction |
| #8 Status → AVAILABLE | `PATCH /trips/:id/cancel` | Atomic transaction |
| #9 Vehicle → IN_SHOP | `POST /maintenance` | Atomic transaction |
| #10 Vehicle → AVAILABLE | `PATCH /maintenance/:id/close` | Atomic transaction |

## CORS

The backend accepts requests from `http://localhost:5173` by default. Change `CORS_ORIGIN` in `.env` if your frontend runs on a different port.
