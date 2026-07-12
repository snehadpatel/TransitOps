const maintenanceService = require('../services/maintenanceService');

async function listMaintenance(req, res, next) {
  try { res.json(await maintenanceService.listMaintenance(req.query)); }
  catch (err) { next(err); }
}

async function getMaintenance(req, res, next) {
  try { res.json(await maintenanceService.getMaintenanceById(req.params.id)); }
  catch (err) { next(err); }
}

async function createMaintenance(req, res, next) {
  try { res.status(201).json(await maintenanceService.createMaintenance(req.body)); }
  catch (err) { next(err); }
}

async function closeMaintenance(req, res, next) {
  try { res.json(await maintenanceService.closeMaintenance(req.params.id)); }
  catch (err) { next(err); }
}

module.exports = { listMaintenance, getMaintenance, createMaintenance, closeMaintenance };
