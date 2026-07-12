const vehicleService = require('../services/vehicleService');

async function listVehicles(req, res, next) {
  try {
    const result = await vehicleService.listVehicles(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

async function getAvailableVehicles(req, res, next) {
  try {
    const vehicles = await vehicleService.getAvailableVehicles();
    res.json(vehicles);
  } catch (err) { next(err); }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    res.json(vehicle);
  } catch (err) { next(err); }
}

async function createVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
}

async function updateVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (err) { next(err); }
}

async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.deleteVehicle(req.params.id);
    res.json(vehicle);
  } catch (err) { next(err); }
}

module.exports = {
  listVehicles, getAvailableVehicles, getVehicle,
  createVehicle, updateVehicle, deleteVehicle,
};
