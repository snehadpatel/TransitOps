# TransitOps — API Reference

> **Base URL:** `http://localhost:5001/api`
> **Auth:** All protected routes require `Authorization: Bearer <JWT>` header.
> **Errors:** All errors return `{ error: string, code: string }`. Validation errors return `{ error, details: [{field, message}] }`.

---

## Authentication

### `POST /auth/login`
Login and receive a JWT token.

**Auth required:** No  
**Body:**
```json
{ "email": "manager@transitops.com", "password": "Password123" }
```
**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Maya Fleet", "email": "...", "role": "FLEET_MANAGER" }
}
```
**Error codes:** `INVALID_CREDENTIALS (401)`, `ACCOUNT_LOCKED (403)`

---

### `GET /auth/me`
Get current authenticated user.

**Auth required:** Yes  
**Response `200`:**
```json
{ "id": "...", "name": "...", "email": "...", "role": "FLEET_MANAGER", "created_at": "..." }
```

---

## Vehicles

| Role | GET list | GET one | POST | PATCH | DELETE |
|---|---|---|---|---|---|
| Fleet Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dispatcher | ✓ | ✓ | ✗ | ✗ | ✗ |
| Safety Officer | ✓ | ✓ | ✗ | ✗ | ✗ |
| Financial Analyst | ✓ | ✓ | ✗ | ✗ | ✗ |

### `GET /vehicles`
List vehicles (paginated, filterable).

**Query params:** `page`, `limit`, `status` (AVAILABLE|ON_TRIP|IN_SHOP|RETIRED), `type` (VAN|TRUCK|BUS|MOTORCYCLE|OTHER), `region`, `search`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "...", "registration_number": "VAN-05", "name_model": "Toyota HiAce",
      "type": "VAN", "max_load_capacity": 500, "odometer": 12500,
      "acquisition_cost": 850000, "status": "AVAILABLE", "region": "North"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### `GET /vehicles/available`
Returns **only AVAILABLE** vehicles (Business Rule #2 — IN_SHOP and RETIRED excluded).  
Use this for the trip dispatcher's vehicle dropdown.

**Response `200`:** Array of vehicle objects.

---

### `GET /vehicles/:id`
Get single vehicle by ID.

---

### `POST /vehicles`
Create a vehicle. **Fleet Manager only.**

**Body:**
```json
{
  "registration_number": "VAN-05",   // required, unique
  "name_model": "Toyota HiAce",       // required
  "type": "VAN",                       // VAN|TRUCK|BUS|MOTORCYCLE|OTHER
  "max_load_capacity": 500,            // kg, required
  "odometer": 0,                       // km, optional
  "acquisition_cost": 850000,          // required
  "status": "AVAILABLE",               // optional, default AVAILABLE
  "region": "North"                    // optional
}
```
**Error:** `DUPLICATE_REGISTRATION_NUMBER (409)` if reg. no. already exists.

---

### `PATCH /vehicles/:id`
Update a vehicle. **Fleet Manager only.** Registration number cannot be changed.

**Body:** Any subset of POST fields, excluding `registration_number`.

---

### `DELETE /vehicles/:id`
Soft-delete (sets status to RETIRED). **Fleet Manager only.**  
Returns `409 VEHICLE_ON_TRIP` if vehicle is currently On Trip.

---

## Drivers

| Role | GET list | GET one | POST | PATCH | DELETE |
|---|---|---|---|---|---|
| Fleet Manager | ✓ | ✓ | ✗ | ✗ | ✗ |
| Dispatcher | ✓ | ✓ | ✗ | ✗ | ✗ |
| Safety Officer | ✓ | ✓ | ✓ | ✓ | ✓ |
| Financial Analyst | ✗ | ✗ | ✗ | ✗ | ✗ |

### `GET /drivers`
List drivers. **Query params:** `page`, `limit`, `status`, `search`

### `GET /drivers/available`
Returns AVAILABLE drivers with **non-expired** licenses only (Business Rules #3 and #4).  
Use this for the trip dispatcher's driver dropdown.

### `GET /drivers/:id` / `POST /drivers` / `PATCH /drivers/:id` / `DELETE /drivers/:id`
Standard CRUD. **Safety Officer only** for write operations.

**POST body:**
```json
{
  "name": "Alex Kumar",
  "license_number": "DL-MH-2019-0042",  // required, unique
  "license_category": "LMV-TR",
  "license_expiry": "2028-06-30T00:00:00.000Z",  // ISO date
  "contact_number": "+91-9876543210",   // optional
  "safety_score": 94.5,                 // 0–100, default 100
  "status": "AVAILABLE"                 // AVAILABLE|ON_TRIP|OFF_DUTY|SUSPENDED
}
```

**Status toggle** (Safety Officer): `PATCH /drivers/:id` with `{ "status": "SUSPENDED" }` or `{ "status": "AVAILABLE" }`

---

## Trips

| Role | GET | POST (create draft) | PATCH dispatch/complete/cancel |
|---|---|---|---|
| Fleet Manager | ✓ | ✗ | ✗ |
| Dispatcher | ✓ | ✓ | ✓ |
| Safety Officer | ✓ | ✗ | ✗ |
| Financial Analyst | ✓ | ✗ | ✗ |

### `GET /trips`
List trips. **Query params:** `page`, `limit`, `status`, `vehicle_id`, `driver_id`, `search`

### `GET /trips/:id`
Get trip with vehicle, driver, fuel_logs, and expenses included.

### `POST /trips`
Create a trip in **DRAFT** status. **Dispatcher only.**

**Body:**
```json
{
  "source": "Mumbai Central",
  "destination": "Pune Station",
  "vehicle_id": "<uuid>",
  "driver_id": "<uuid>",
  "cargo_weight": 450,        // kg
  "planned_distance": 148,    // km
  "eta": "2026-07-13T14:00:00.000Z"  // optional
}
```

---

### `PATCH /trips/:id/dispatch`
Dispatches a DRAFT trip → DISPATCHED. **Dispatcher only.**

Enforces all pre-dispatch business rules server-side:
- **Rule 2:** Vehicle not RETIRED or IN_SHOP → `409 VEHICLE_UNAVAILABLE`
- **Rule 3:** Driver not SUSPENDED → `409 DRIVER_SUSPENDED`
- **Rule 3:** Driver license not expired → `409 LICENSE_EXPIRED`
- **Rule 4:** Vehicle not already ON_TRIP → `409 VEHICLE_ON_TRIP`
- **Rule 4:** Driver not already ON_TRIP → `409 DRIVER_ON_TRIP`
- **Rule 5:** `cargo_weight ≤ max_load_capacity` → `409 CAPACITY_EXCEEDED`
  ```json
  {
    "error": "Cargo weight exceeds vehicle capacity. Vehicle Capacity: 500 kg, Cargo Weight: 700 kg — Capacity exceeded by 200 kg.",
    "code": "CAPACITY_EXCEEDED"
  }
  ```
- **Rule 6:** On success, vehicle + driver status → `ON_TRIP` (atomic transaction)

**No body required.**

---

### `PATCH /trips/:id/complete`
Completes a DISPATCHED trip → COMPLETED. **Dispatcher only.**

**Body:**
```json
{
  "final_odometer": 12648,   // optional — updates vehicle odometer
  "fuel_consumed": 18.5      // optional — auto-creates a FuelLog record
}
```
- **Rule 7:** Vehicle + Driver → `AVAILABLE`
- Auto-creates `FuelLog` if `fuel_consumed > 0`

---

### `PATCH /trips/:id/cancel`
Cancels a DISPATCHED trip → CANCELLED. **Dispatcher only.**

- **Rule 8:** Vehicle + Driver → `AVAILABLE`

**No body required.**

---

## Maintenance

| Role | GET | POST | PATCH close |
|---|---|---|---|
| Fleet Manager | ✓ | ✓ | ✓ |
| Dispatcher | ✓ | ✗ | ✗ |
| Safety Officer | ✓ | ✗ | ✗ |
| Financial Analyst | ✓ | ✗ | ✗ |

### `GET /maintenance`
**Query params:** `page`, `limit`, `status` (ACTIVE|CLOSED), `vehicle_id`

### `POST /maintenance`
Create a maintenance record. **Fleet Manager only.**

**Body:**
```json
{
  "vehicle_id": "<uuid>",
  "service_type": "Oil Change",  // required
  "cost": 3500,                   // required
  "date": "2026-07-12T00:00:00.000Z",  // optional, default now
  "notes": "Routine 5000km service"    // optional
}
```
- **Rule 9:** Vehicle status → `IN_SHOP` automatically.
- Returns `409 VEHICLE_ON_TRIP` if vehicle is currently On Trip.
- Returns `409 VEHICLE_RETIRED` if vehicle is Retired.

### `PATCH /maintenance/:id/close`
Close a maintenance record (ACTIVE → CLOSED). **Fleet Manager only.**

- **Rule 10:** Vehicle status → `AVAILABLE` (unless vehicle is RETIRED — stays RETIRED).
- Returns `409 ALREADY_CLOSED` if already closed.

---

## Fuel Logs

| Role | GET | POST | PATCH | DELETE |
|---|---|---|---|---|
| All roles | ✓ | ✗ | ✗ | ✗ |
| Financial Analyst | ✓ | ✓ | ✓ | ✓ |

### `GET /fuel`
**Query params:** `page`, `limit`, `vehicle_id`, `trip_id`

### `POST /fuel`
**Financial Analyst only.**
```json
{
  "vehicle_id": "<uuid>",
  "trip_id": "<uuid>",   // optional
  "liters": 18.5,
  "cost": 2220,
  "date": "2026-07-12T00:00:00.000Z"  // optional
}
```

### `PATCH /fuel/:id` / `DELETE /fuel/:id`
**Financial Analyst only.**

---

## Expenses

### `GET /expenses`
**Query params:** `page`, `limit`, `vehicle_id`, `trip_id`

### `POST /expenses`
**Financial Analyst only.**
```json
{
  "vehicle_id": "<uuid>",
  "trip_id": "<uuid>",   // optional
  "toll": 150,
  "other": 200,
  // "total" is auto-computed: toll + other
  "category": "Toll + Misc",
  "date": "2026-07-12T00:00:00.000Z",
  "notes": "Highway toll"
}
```
`total` is always computed server-side as `toll + other`.

### `PATCH /expenses/:id` / `DELETE /expenses/:id`
**Financial Analyst only.**

---

## Analytics

All analytics routes require authentication. All roles can access dashboard; reports visible to all roles.

### `GET /analytics/dashboard`
Returns all 7 dashboard KPIs + vehicle status breakdown + recent trips.

**Response `200`:**
```json
{
  "kpis": {
    "totalVehicles": 5,
    "availableVehicles": 3,
    "inMaintenanceVehicles": 1,
    "onTripVehicles": 0,
    "retiredVehicles": 1,
    "activeTrips": 0,
    "pendingTrips": 0,
    "driversOnDuty": 2,
    "fleetUtilization": 0
  },
  "vehicleStatusBreakdown": {
    "available": 3, "onTrip": 0, "inShop": 1, "retired": 1
  },
  "recentTrips": [...]
}
```

### `GET /analytics/reports`
Returns Reports & Analytics KPIs.

**Response `200`:**
```json
{
  "fuelEfficiency": 8.0,           // km/L (totalDistance / totalFuelLiters)
  "fleetUtilization": 80,          // % (non-retired vehicles / total)
  "totalOperationalCost": 5720,    // Fuel cost + Maintenance cost
  "roi": -3.65,                    // % (Revenue - OpCost) / AcquisitionCost
  "totalFuelLiters": 18.5,
  "totalFuelCost": 2220,
  "totalMaintenanceCost": 3500,
  "totalDistance": 148,
  "completedTrips": 1
}
```

### `GET /analytics/reports/export`
Downloads a CSV of all trips. Sets `Content-Disposition: attachment; filename="transitops-report.csv"`.

---

## Settings

### `GET /settings`
Returns global depot settings. All roles.

**Response `200`:**
```json
{ "id": "global", "depot_name": "TransitOps Central Depot", "currency": "INR", "distance_unit": "km" }
```

### `PATCH /settings`
Update settings. **Fleet Manager only.**
```json
{
  "depot_name": "New Depot Name",
  "currency": "INR",
  "distance_unit": "km"  // km | miles
}
```

---

## Error Reference

| HTTP | Code | Meaning |
|---|---|---|
| 400 | VALIDATION_FAILED | Zod validation error — check `details` array |
| 401 | UNAUTHENTICATED | Missing or invalid Bearer token |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 401 | TOKEN_EXPIRED | JWT has expired |
| 403 | FORBIDDEN | Role does not have access |
| 403 | ACCOUNT_LOCKED | Too many failed login attempts |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | DUPLICATE_REGISTRATION_NUMBER | Vehicle reg. no. already in use |
| 409 | VEHICLE_UNAVAILABLE | Vehicle is RETIRED or IN_SHOP |
| 409 | VEHICLE_ON_TRIP | Vehicle already assigned to a trip |
| 409 | DRIVER_ON_TRIP | Driver already assigned to a trip |
| 409 | DRIVER_SUSPENDED | Driver status is SUSPENDED |
| 409 | LICENSE_EXPIRED | Driver's license has expired |
| 409 | CAPACITY_EXCEEDED | Cargo weight > vehicle max load capacity |
| 409 | VEHICLE_RETIRED | Cannot perform action on a Retired vehicle |
| 409 | ALREADY_CLOSED | Maintenance record is already closed |
| 500 | INTERNAL_ERROR | Unexpected server error |

---

## Seeded Test Accounts

| Role | Email | Password |
|---|---|---|
| Fleet Manager | `manager@transitops.com` | `Password123` |
| Dispatcher | `dispatcher@transitops.com` | `Password123` |
| Safety Officer | `safety@transitops.com` | `Password123` |
| Financial Analyst | `analyst@transitops.com` | `Password123` |

### Seeded Test Data for Business Rule Testing

| Entity | Detail | Purpose |
|---|---|---|
| Vehicle `BUS-03` | status: `IN_SHOP` | Tests Rule #2 (should not appear in /available) |
| Vehicle `TRK-08` | status: `RETIRED` | Tests Rule #2 |
| Driver `Rajan Nair` | license expired `2025-01-01` | Tests Rule #3 |
| Driver `Sunita Mehta` | status: `SUSPENDED` | Tests Rule #3 |
