# Decisions, Assumptions, and Verification Checklist

This document lists the architectural decisions, assumptions, and test validation checks for the TransitOps system.

## Business Rules Verification Checklist

| Rule # | Business Rule | Test Case Description | Pass/Fail |
| --- | --- | --- | --- |
| 1 | Vehicle Registration Number must be unique | Attempt to create vehicle with duplicate registration number. Expected: API error. | **PASS** |
| 2 | Retired/In Shop vehicles omitted from dispatch list | Query vehicles for trip dispatch dropdown (`/vehicles/available`). Expected: Retired/In Shop omitted. | **PASS** |
| 3 | Expired/Suspended drivers cannot be assigned | Attempt to create/dispatch trip with driver who is suspended or has expired license. Expected: Validation error. | **PASS** |
| 4 | On Trip driver/vehicle cannot be reassigned | Attempt to assign a driver/vehicle currently On Trip to a new trip. Expected: Validation error. | **PASS** |
| 5 | Cargo Weight does not exceed Max Capacity | Create trip where weight > capacity. Expected: Return capacity exceeded details. | **PASS** |
| 6 | Dispatch sets vehicle/driver to On Trip | Dispatch a trip. Expected: Vehicle/driver status changes to On Trip. | **PASS** |
| 7 | Complete sets vehicle/driver to Available | Complete a trip. Expected: Vehicle/driver status changes to Available. | **PASS** |
| 8 | Cancel sets vehicle/driver to Available | Cancel a dispatched trip. Expected: Vehicle/driver status changes to Available. | **PASS** |
| 9 | Maintenance record sets vehicle to In Shop | Create active maintenance log. Expected: Vehicle status changes to In Shop. | **PASS** |
| 10 | Closing maintenance restores vehicle status | Close maintenance log. Expected: Status returns to Available. | **PASS** |

---

## Key Decisions & Assumptions

### 1. Role Enum Realignment (`DRIVER` ➔ `DISPATCHER`)
- **Spec conflict:** The roles requested in the functional specifications are `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, and `FINANCIAL_ANALYST`. However, the starter schema used `DRIVER` as a user role instead of `DISPATCHER`.
- **Decision:** Renamed the role to `DISPATCHER` to maintain perfect compatibility with the specification's description of dispatching trips and RBAC matrix.

### 2. Splitting Fuel and Expenses
- **Spec context:** The specification lists Fuel Logs and Expenses as two separate categories of cost tracking.
- **Decision:** Created two distinct models (`FuelLog` and `Expense`) rather than a single unified table. This keeps fuel analytics separate from toll/miscellaneous costs and allows automatic generation of `FuelLog` records when a dispatcher completes a trip with `fuel_consumed` details.

### 3. JavaScript with JSDoc instead of TypeScript Migration
- **Decision:** Given the time constraint of a hackathon and potential build speed limits, the backend and frontend are built using clean ES Modules/CommonJS with descriptive JSDoc typings.

### 4. Port Conflict Resolution (Port 5000 ➔ 5001)
- **Problem:** macOS Control Center listens on port 5000 by default, causing `EADDRINUSE` errors on startup.
- **Decision:** Shifted default backend port to `5001`. Configured the root `.env.example` and frontend settings to reference `5001` natively.

### 5. Automatic Trip Completing Logic
- **Decision:** Completing a trip updates the vehicle's odometer by adding the planned distance of the completed trip. If `fuel_consumed` is passed in the completion call, a `FuelLog` record is automatically created to link cost records seamlessly.

