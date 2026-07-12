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
    req.app.get('io').emit('vehicle-updated');
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
}

async function updateVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    req.app.get('io').emit('vehicle-updated');
    res.json(vehicle);
  } catch (err) { next(err); }
}

async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.deleteVehicle(req.params.id);
    req.app.get('io').emit('vehicle-updated');
    res.json(vehicle);
  } catch (err) { next(err); }
}

async function getDocuments(req, res, next) {
  try {
    const documents = await vehicleService.getDocuments(req.params.id);
    res.json(documents);
  } catch (err) { next(err); }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const url = `/uploads/${req.file.filename}`;
    const name = req.file.originalname;
    const document = await vehicleService.addDocument(req.params.id, url, name);
    res.status(201).json(document);
  } catch (err) { next(err); }
}

module.exports = {
  listVehicles, getAvailableVehicles, getVehicle,
  createVehicle, updateVehicle, deleteVehicle,
  getDocuments, uploadDocument
};
