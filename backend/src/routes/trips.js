const { z } = require('zod');
const { Router } = require('express');
const ctrl = require('../controllers/tripController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

const tripSchema = z.object({
  source: z.string().min(1, 'Source is required.'),
  destination: z.string().min(1, 'Destination is required.'),
  vehicle_id: z.string().uuid('Invalid vehicle ID.'),
  driver_id: z.string().uuid('Invalid driver ID.'),
  cargo_weight: z.coerce.number().positive('Cargo weight must be positive.'),
  planned_distance: z.coerce.number().positive('Planned distance must be positive.'),
  eta: z.coerce.date().optional(),
});

const completeSchema = z.object({
  final_odometer: z.coerce.number().positive().optional(),
  fuel_consumed: z.coerce.number().min(0).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']).optional(),
  vehicle_id: z.string().optional(),
  driver_id: z.string().optional(),
  search: z.string().optional(),
});

// Dispatcher, Safety Officer, and Fleet Manager can view trips (Financial Analyst excluded)
router.get(
  '/',
  requireRole('DISPATCHER', 'SAFETY_OFFICER', 'FLEET_MANAGER'),
  validateQuery(listQuerySchema),
  ctrl.listTrips
);
router.get(
  '/:id',
  requireRole('DISPATCHER', 'SAFETY_OFFICER', 'FLEET_MANAGER'),
  ctrl.getTrip
);

// Only Dispatcher can create/manage trips
router.post('/', requireRole('DISPATCHER'), validate(tripSchema), ctrl.createTrip);
router.patch('/:id/dispatch', requireRole('DISPATCHER'), ctrl.dispatchTrip);
router.patch('/:id/complete', requireRole('DISPATCHER'), validate(completeSchema), ctrl.completeTrip);
router.patch('/:id/cancel', requireRole('DISPATCHER'), ctrl.cancelTrip);

module.exports = router;
