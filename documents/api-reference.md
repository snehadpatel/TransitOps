# TransitOps API Reference

*This document outlines all system API routes, methods, payloads, and RBAC requirements.*

## Authentication

- **POST** `/api/auth/login`
  - Body: `{ email, password, role }`
  - Response: `{ token, user: { id, name, email, role } }`

## Vehicles (Fleet)

- **GET** `/api/vehicles` (Protected: Fleet Manager, Financial Analyst)
- **POST** `/api/vehicles` (Protected: Fleet Manager)
- **PUT** `/api/vehicles/:id` (Protected: Fleet Manager)
- **DELETE** `/api/vehicles/:id` (Protected: Fleet Manager)

## Drivers

- **GET** `/api/drivers` (Protected: Fleet Manager, Dispatcher, Safety Officer)
- **POST** `/api/drivers` (Protected: Safety Officer)
- **PUT** `/api/drivers/:id` (Protected: Safety Officer)
- **DELETE** `/api/drivers/:id` (Protected: Safety Officer)
- **POST** `/api/drivers/:id/status` (Protected: Safety Officer)

## Trips

- **GET** `/api/trips` (Protected: Dispatcher, Safety Officer)
- **POST** `/api/trips` (Protected: Dispatcher)
- **POST** `/api/trips/:id/dispatch` (Protected: Dispatcher)
- **POST** `/api/trips/:id/complete` (Protected: Dispatcher)
- **POST** `/api/trips/:id/cancel` (Protected: Dispatcher)

## Maintenance

- **GET** `/api/maintenance` (Protected: Fleet Manager)
- **POST** `/api/maintenance` (Protected: Fleet Manager)
- **PUT** `/api/maintenance/:id` (Protected: Fleet Manager)

## Fuel & Expenses

- **GET** `/api/expenses` (Protected: Financial Analyst)
- **POST** `/api/fuel-logs` (Protected: Financial Analyst)
- **POST** `/api/expenses` (Protected: Financial Analyst)

## Analytics

- **GET** `/api/analytics` (Protected: Financial Analyst)
