const { Router } = require('express');
const ctrl = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = Router();
router.use(authenticate);

// Dashboard accessible by all roles
router.get('/dashboard', ctrl.getDashboard);

// Reports: Financial Analyst + Fleet Manager view
router.get(
  '/reports',
  requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'),
  ctrl.getReports
);
router.get(
  '/reports/export',
  requireRole('FINANCIAL_ANALYST', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'),
  ctrl.exportCSV
);

module.exports = router;
