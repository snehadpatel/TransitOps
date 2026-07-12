const driverService = require('../services/driverService');

async function listDrivers(req, res, next) {
  try { res.json(await driverService.listDrivers(req.query)); }
  catch (err) { next(err); }
}

async function getAvailableDrivers(req, res, next) {
  try { res.json(await driverService.getAvailableDrivers()); }
  catch (err) { next(err); }
}

async function getDriver(req, res, next) {
  try { res.json(await driverService.getDriverById(req.params.id)); }
  catch (err) { next(err); }
}

async function createDriver(req, res, next) {
  try { res.status(201).json(await driverService.createDriver(req.body)); }
  catch (err) { next(err); }
}

async function updateDriver(req, res, next) {
  try { res.json(await driverService.updateDriver(req.params.id, req.body)); }
  catch (err) { next(err); }
}

async function deleteDriver(req, res, next) {
  try { res.json(await driverService.deleteDriver(req.params.id)); }
  catch (err) { next(err); }
}

module.exports = { listDrivers, getAvailableDrivers, getDriver, createDriver, updateDriver, deleteDriver };
