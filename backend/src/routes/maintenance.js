const { z } = require('zod');
const { Router } = require('express');
const ctrl = require('../controllers/maintenanceController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

const maintenanceSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID.'),
  service_type: z.string().min(1, 'Service type is required.'),
  cost: z.coerce.number().min(0, 'Cost must be non-negative.'),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  vehicle_id: z.string().optional(),
});

// All authenticated users can view maintenance
router.get('/', validateQuery(listQuerySchema), ctrl.listMaintenance);
router.get('/:id', ctrl.getMaintenance);

// Fleet Manager owns maintenance
router.post('/', requireRole('FLEET_MANAGER'), validate(maintenanceSchema), ctrl.createMaintenance);
router.patch('/:id/close', requireRole('FLEET_MANAGER'), ctrl.closeMaintenance);

module.exports = router;
