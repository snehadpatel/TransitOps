const { Router } = require('express');
const ctrl = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = Router();
router.use(authenticate);

// Dashboard accessible by all roles
router.get('/dashboard', ctrl.getDashboard);

// Reports: Financial Analyst view only
router.get(
  '/reports',
  requireRole('FINANCIAL_ANALYST'),
  ctrl.getReports
);
router.get(
  '/reports/export',
  requireRole('FINANCIAL_ANALYST'),
  ctrl.exportCSV
);

module.exports = router;
