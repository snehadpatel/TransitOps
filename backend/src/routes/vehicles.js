const { z } = require('zod');
const { Router } = require('express');
const ctrl = require('../controllers/vehicleController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required.').max(20),
  name_model: z.string().min(1, 'Vehicle name/model is required.'),
  type: z.enum(['VAN', 'TRUCK', 'BUS', 'MOTORCYCLE', 'OTHER']).default('OTHER'),
  max_load_capacity: z.coerce.number().positive('Max load capacity must be positive.'),
  odometer: z.coerce.number().min(0).optional().default(0),
  acquisition_cost: z.coerce.number().positive('Acquisition cost must be positive.'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional().default('AVAILABLE'),
  region: z.string().optional(),
});

const vehicleUpdateSchema = vehicleSchema.partial().omit({ registration_number: true });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  type: z.enum(['VAN', 'TRUCK', 'BUS', 'MOTORCYCLE', 'OTHER']).optional(),
  region: z.string().optional(),
  search: z.string().optional(),
});

// Authorized roles can view (Dispatcher and Safety Officer excluded from general registry)
router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), validateQuery(listQuerySchema), ctrl.listVehicles);
router.get('/available', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'), ctrl.getAvailableVehicles);
router.get('/:id', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.getVehicle);

// Only Fleet Manager can create/update/delete
router.post('/', requireRole('FLEET_MANAGER'), validate(vehicleSchema), ctrl.createVehicle);
router.patch('/:id', requireRole('FLEET_MANAGER'), validate(vehicleUpdateSchema), ctrl.updateVehicle);
router.delete('/:id', requireRole('FLEET_MANAGER'), ctrl.deleteVehicle);

const upload = require('../middlewares/upload');

// Document Management
router.get('/:id/documents', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), ctrl.getDocuments);
router.post('/:id/documents', requireRole('FLEET_MANAGER'), upload.single('document'), ctrl.uploadDocument);

module.exports = router;
