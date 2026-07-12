const tripService = require('../services/tripService');

async function listTrips(req, res, next) {
  try { res.json(await tripService.listTrips(req.query)); }
  catch (err) { next(err); }
}

async function getTrip(req, res, next) {
  try { res.json(await tripService.getTripById(req.params.id)); }
  catch (err) { next(err); }
}

async function createTrip(req, res, next) {
  try { 
    const trip = await tripService.createTrip(req.body);
    req.app.get('io').emit('trip-updated');
    res.status(201).json(trip);
  } catch (err) { next(err); }
}

async function updateTrip(req, res, next) {
  try {
    const trip = await tripService.updateDraftTrip(req.params.id, req.body);
    req.app.get('io').emit('trip-updated');
    res.json(trip);
  } catch (err) { next(err); }
}

async function dispatchTrip(req, res, next) {
  try {
    const trip = await tripService.dispatchTrip(req.params.id);
    req.app.get('io').emit('trip-updated');
    req.app.get('io').emit('vehicle-updated');
    res.json(trip);
  } catch (err) { next(err); }
}

async function completeTrip(req, res, next) {
  try {
    const trip = await tripService.completeTrip(req.params.id, req.body);
    req.app.get('io').emit('trip-updated');
    req.app.get('io').emit('vehicle-updated');
    res.json(trip);
  } catch (err) { next(err); }
}

async function cancelTrip(req, res, next) {
  try {
    const trip = await tripService.cancelTrip(req.params.id);
    req.app.get('io').emit('trip-updated');
    req.app.get('io').emit('vehicle-updated');
    res.json(trip);
  } catch (err) { next(err); }
}

module.exports = { listTrips, getTrip, createTrip, updateTrip, dispatchTrip, completeTrip, cancelTrip };
