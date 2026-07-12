const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTripCode() {
  return `TRIP-${Date.now().toString(36).toUpperCase()}`;
}

// ─── List / Read ──────────────────────────────────────────────────────────────

async function listTrips({ page, limit, status, vehicle_id, driver_id, search }) {
  const { skip, take, meta } = paginate(page, limit);

  const where = {
    ...(status && { status }),
    ...(vehicle_id && { vehicle_id }),
    ...(driver_id && { driver_id }),
    ...(search && {
      OR: [
        { trip_code: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where, skip, take,
      orderBy: { created_at: 'desc' },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return { data: trips, meta: meta(total) };
}

async function getTripById(id) {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      fuel_logs: true,
      expenses: true,
    },
  });
  if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');
  return trip;
}

// ─── Create (DRAFT) ───────────────────────────────────────────────────────────

async function createTrip(data) {
  return prisma.trip.create({
    data: { ...data, trip_code: generateTripCode(), status: 'DRAFT' },
    include: {
      vehicle: { select: { id: true, registration_number: true, name_model: true } },
      driver: { select: { id: true, name: true } },
    },
  });
}

// ─── Dispatch (DRAFT → DISPATCHED) ───────────────────────────────────────────

/**
 * Dispatches a trip, enforcing all pre-dispatch business rules:
 * Rule 2: Vehicle must not be Retired or In Shop.
 * Rule 3: Driver must not have expired license or Suspended status.
 * Rule 4: Vehicle and Driver must not already be On Trip.
 * Rule 5: Cargo weight must not exceed vehicle max load capacity.
 * Rule 6: On dispatch, set Vehicle and Driver status to On Trip.
 */
async function dispatchTrip(tripId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');

  if (trip.status !== 'DRAFT') {
    throw new AppError(`Cannot dispatch a trip with status "${trip.status}".`, 409, 'INVALID_STATUS');
  }

  const { vehicle, driver } = trip;

  // Rule 2: Vehicle availability check
  if (vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
    throw new AppError(
      `Vehicle "${vehicle.registration_number}" is ${vehicle.status} and cannot be dispatched.`,
      409, 'VEHICLE_UNAVAILABLE'
    );
  }

  // Rule 4: Vehicle on-trip check
  if (vehicle.status === 'ON_TRIP') {
    throw new AppError(
      `Vehicle "${vehicle.registration_number}" is already On Trip.`,
      409, 'VEHICLE_ON_TRIP'
    );
  }

  // Rule 3 + 4: Driver checks
  if (driver.status === 'SUSPENDED') {
    throw new AppError(
      `Driver "${driver.name}" is Suspended and cannot be assigned to a trip.`,
      409, 'DRIVER_SUSPENDED'
    );
  }
  if (driver.status === 'ON_TRIP') {
    throw new AppError(
      `Driver "${driver.name}" is already On Trip.`,
      409, 'DRIVER_ON_TRIP'
    );
  }
  if (new Date(driver.license_expiry) <= new Date()) {
    throw new AppError(
      `Driver "${driver.name}" has an expired license (expired ${new Date(driver.license_expiry).toLocaleDateString()}).`,
      409, 'LICENSE_EXPIRED'
    );
  }

  // Rule 5: Cargo weight vs vehicle capacity
  if (trip.cargo_weight > vehicle.max_load_capacity) {
    const excess = (trip.cargo_weight - vehicle.max_load_capacity).toFixed(2);
    throw new AppError(
      `Cargo weight exceeds vehicle capacity. Vehicle Capacity: ${vehicle.max_load_capacity} kg, Cargo Weight: ${trip.cargo_weight} kg — Capacity exceeded by ${excess} kg.`,
      409, 'CAPACITY_EXCEEDED'
    );
  }

  // Rule 6: Dispatch atomically (trip → DISPATCHED, vehicle → ON_TRIP, driver → ON_TRIP)
  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: 'DISPATCHED', started_at: new Date() },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } }),
  ]);

  return updatedTrip;
}

// ─── Complete (DISPATCHED → COMPLETED) ───────────────────────────────────────

/**
 * Completes a trip.
 * Rule 7: On completion, set Vehicle and Driver back to Available.
 * Also auto-creates a FuelLog if fuel_consumed is provided.
 */
async function completeTrip(tripId, { final_odometer, fuel_consumed }) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');

  if (trip.status !== 'DISPATCHED') {
    throw new AppError(`Cannot complete a trip with status "${trip.status}".`, 409, 'INVALID_STATUS');
  }

  const ops = [
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        final_odometer,
        fuel_consumed,
      },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicle_id },
      data: {
        status: 'AVAILABLE',
        ...(final_odometer && { odometer: final_odometer }),
      },
    }),
    prisma.driver.update({
      where: { id: trip.driver_id },
      data: {
        status: 'AVAILABLE',
        trip_completions: { increment: 1 },
      },
    }),
  ];

  // Auto-create fuel log if fuel consumed was recorded
  if (fuel_consumed && fuel_consumed > 0) {
    ops.push(
      prisma.fuelLog.create({
        data: {
          vehicle_id: trip.vehicle_id,
          trip_id: tripId,
          liters: fuel_consumed,
          cost: 0, // cost can be updated separately in Fuel & Expenses screen
          date: new Date(),
        },
      })
    );
  }

  const [updatedTrip] = await prisma.$transaction(ops);
  return updatedTrip;
}

// ─── Cancel (DISPATCHED → CANCELLED) ─────────────────────────────────────────

/**
 * Cancels a dispatched trip.
 * Rule 8: On cancellation, restore Vehicle and Driver to Available.
 */
async function cancelTrip(tripId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });
  if (!trip) throw new AppError('Trip not found.', 404, 'NOT_FOUND');

  if (trip.status !== 'DISPATCHED') {
    throw new AppError(`Cannot cancel a trip with status "${trip.status}". Only dispatched trips can be cancelled.`, 409, 'INVALID_STATUS');
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: 'CANCELLED', cancelled_at: new Date() },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        driver: { select: { id: true, name: true } },
      },
    }),
    prisma.vehicle.update({ where: { id: trip.vehicle_id }, data: { status: 'AVAILABLE' } }),
    prisma.driver.update({ where: { id: trip.driver_id }, data: { status: 'AVAILABLE' } }),
  ]);

  return updatedTrip;
}

module.exports = { listTrips, getTripById, createTrip, dispatchTrip, completeTrip, cancelTrip };
