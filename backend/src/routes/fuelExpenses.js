const { z } = require('zod');
const { Router } = require('express');
const fuelCtrl = require('../controllers/fuelController');
const expenseCtrl = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

// ─── Fuel Logs ────────────────────────────────────────────────────────────────

const fuelLogSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID.'),
  trip_id: z.string().uuid().optional().nullable(),
  date: z.coerce.date().optional(),
  liters: z.coerce.number().positive('Liters must be positive.'),
  cost: z.coerce.number().min(0, 'Cost must be non-negative.'),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  vehicle_id: z.string().optional(),
  trip_id: z.string().optional(),
});

router.get('/fuel', requireRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'), validateQuery(listQuerySchema), fuelCtrl.listFuelLogs);
router.post('/fuel', requireRole('FINANCIAL_ANALYST'), validate(fuelLogSchema), fuelCtrl.createFuelLog);
router.patch('/fuel/:id', requireRole('FINANCIAL_ANALYST'), validate(fuelLogSchema.partial()), fuelCtrl.updateFuelLog);
router.delete('/fuel/:id', requireRole('FINANCIAL_ANALYST'), fuelCtrl.deleteFuelLog);

// ─── Expenses ─────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID.'),
  trip_id: z.string().uuid().optional().nullable(),
  toll: z.coerce.number().min(0).optional().default(0),
  other: z.coerce.number().min(0).optional().default(0),
  category: z.string().optional(),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

router.get('/expenses', requireRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'), validateQuery(listQuerySchema), expenseCtrl.listExpenses);
router.post('/expenses', requireRole('FINANCIAL_ANALYST'), validate(expenseSchema), expenseCtrl.createExpense);
router.patch('/expenses/:id', requireRole('FINANCIAL_ANALYST'), validate(expenseSchema.partial()), expenseCtrl.updateExpense);
router.delete('/expenses/:id', requireRole('FINANCIAL_ANALYST'), expenseCtrl.deleteExpense);

module.exports = router;
