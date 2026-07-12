const analyticsService = require('../services/analyticsService');

async function getDashboard(req, res, next) {
  try { res.json(await analyticsService.getDashboardKPIs()); }
  catch (err) { next(err); }
}

async function getReports(req, res, next) {
  try { res.json(await analyticsService.getReportsKPIs()); }
  catch (err) { next(err); }
}

async function exportCSV(req, res, next) {
  try {
    const csv = await analyticsService.getReportsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getReports, exportCSV };
