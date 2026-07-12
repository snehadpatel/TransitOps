const { z } = require('zod');
const { Router } = require('express');
const settingsService = require('../services/settingsService');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');

const router = Router();
router.use(authenticate);

const settingsSchema = z.object({
  depot_name: z.string().min(1).optional(),
  currency: z.string().min(1).max(10).optional(),
  distance_unit: z.enum(['km', 'miles']).optional(),
});

router.get('/', async (req, res, next) => {
  try { res.json(await settingsService.getSettings()); }
  catch (err) { next(err); }
});

router.patch(
  '/',
  requireRole('FLEET_MANAGER'),
  validate(settingsSchema),
  async (req, res, next) => {
    try { res.json(await settingsService.updateSettings(req.body)); }
    catch (err) { next(err); }
  }
);

module.exports = router;
