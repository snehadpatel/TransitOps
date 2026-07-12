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
  try { res.status(201).json(await tripService.createTrip(req.body)); }
  catch (err) { next(err); }
}

async function dispatchTrip(req, res, next) {
  try { res.json(await tripService.dispatchTrip(req.params.id)); }
  catch (err) { next(err); }
}

async function completeTrip(req, res, next) {
  try { res.json(await tripService.completeTrip(req.params.id, req.body)); }
  catch (err) { next(err); }
}

async function cancelTrip(req, res, next) {
  try { res.json(await tripService.cancelTrip(req.params.id)); }
  catch (err) { next(err); }
}

module.exports = { listTrips, getTrip, createTrip, dispatchTrip, completeTrip, cancelTrip };
