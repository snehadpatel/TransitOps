const { z } = require('zod');
const { Router } = require('express');
const ctrl = require('../controllers/driverController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  license_number: z.string().min(1, 'License number is required.'),
  license_category: z.string().min(1, 'License category is required.'),
  license_expiry: z.coerce.date({ required_error: 'License expiry date is required.' }),
  contact_number: z.string().optional(),
  safety_score: z.coerce.number().min(0).max(100).optional().default(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional().default('AVAILABLE'),
});

const driverUpdateSchema = driverSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  search: z.string().optional(),
});

// All authenticated roles can view
router.get('/', validateQuery(listQuerySchema), ctrl.listDrivers);
router.get('/available', ctrl.getAvailableDrivers);
router.get('/:id', ctrl.getDriver);

// Only Safety Officer can create/update/delete
router.post('/', requireRole('SAFETY_OFFICER'), validate(driverSchema), ctrl.createDriver);
router.patch('/:id', requireRole('SAFETY_OFFICER'), validate(driverUpdateSchema), ctrl.updateDriver);
router.delete('/:id', requireRole('SAFETY_OFFICER'), ctrl.deleteDriver);

module.exports = router;
