# Decisions, Assumptions, and Verification Checklist

*This document lists any project decisions/assumptions made during development, along with a checklist validating all business rules.*

## Business Rules Verification Checklist

| Rule # | Business Rule | Test Case Description | Pass/Fail |
| --- | --- | --- | --- |
| 1 | Vehicle Registration Number must be unique | Attempt to create vehicle with duplicate registration number. Expected: API error. | [ ] |
| 2 | Retired/In Shop vehicles omitted from dispatch list | Query vehicles for trip dispatch dropdown. Expected: Retired/In Shop omitted. | [ ] |
| 3 | Expired/Suspended drivers cannot be assigned | Attempt to create/dispatch trip with driver who is suspended or has expired license. Expected: Validation error. | [ ] |
| 4 | On Trip driver/vehicle cannot be reassigned | Attempt to assign a driver/vehicle currently On Trip to a new trip. Expected: Validation error. | [ ] |
| 5 | Cargo Weight does not exceed Max Capacity | Create trip where weight > capacity. Expected: Return exact capacity excess and block. | [ ] |
| 6 | Dispatch sets vehicle/driver to On Trip | Dispatch a trip. Expected: Vehicle/driver status changes to On Trip. | [ ] |
| 7 | Complete sets vehicle/driver to Available | Complete a trip. Expected: Vehicle/driver status changes to Available. | [ ] |
| 8 | Cancel sets vehicle/driver to Available | Cancel a dispatched trip. Expected: Vehicle/driver status changes to Available. | [ ] |
| 9 | Maintenance record sets vehicle to In Shop | Create active maintenance log. Expected: Vehicle status changes to In Shop. | [ ] |
| 10 | Closing maintenance restores vehicle status | Close maintenance log. Expected: Status returns to Available (if not Retired). | [ ] |

## Key Decisions & Assumptions

*None recorded yet.*
