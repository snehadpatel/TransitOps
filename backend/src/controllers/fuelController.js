const fuelService = require('../services/fuelService');

async function listFuelLogs(req, res, next) {
  try { res.json(await fuelService.listFuelLogs(req.query)); }
  catch (err) { next(err); }
}

async function createFuelLog(req, res, next) {
  try { res.status(201).json(await fuelService.createFuelLog(req.body)); }
  catch (err) { next(err); }
}

async function updateFuelLog(req, res, next) {
  try { res.json(await fuelService.updateFuelLog(req.params.id, req.body)); }
  catch (err) { next(err); }
}

async function deleteFuelLog(req, res, next) {
  try { res.json(await fuelService.deleteFuelLog(req.params.id)); }
  catch (err) { next(err); }
}

module.exports = { listFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog };
