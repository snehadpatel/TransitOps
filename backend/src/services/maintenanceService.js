const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

async function listMaintenance({ page, limit, status, vehicle_id }) {
  const { skip, take, meta } = paginate(page, limit);
  const where = {
    ...(status && { status }),
    ...(vehicle_id && { vehicle_id }),
  };

  const [logs, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where, skip, take,
      orderBy: { created_at: 'desc' },
      include: { vehicle: { select: { id: true, registration_number: true, name_model: true } } },
    }),
    prisma.maintenanceLog.count({ where }),
  ]);

  return { data: logs, meta: meta(total) };
}

async function getMaintenanceById(id) {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!log) throw new AppError('Maintenance record not found.', 404, 'NOT_FOUND');
  return log;
}

/**
 * Creates a maintenance record.
 * Business Rule #9: Creating an ACTIVE maintenance record sets vehicle status to IN_SHOP.
 */
async function createMaintenance(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  if (vehicle.status === 'ON_TRIP') {
    throw new AppError('Cannot create maintenance for a vehicle that is currently On Trip.', 409, 'VEHICLE_ON_TRIP');
  }
  if (vehicle.status === 'RETIRED') {
    throw new AppError('Cannot create maintenance for a Retired vehicle.', 409, 'VEHICLE_RETIRED');
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: { ...data, status: 'ACTIVE' },
      include: { vehicle: { select: { id: true, registration_number: true, name_model: true } } },
    }),
    prisma.vehicle.update({ where: { id: data.vehicle_id }, data: { status: 'IN_SHOP' } }),
  ]);

  return log;
}

/**
 * Closes a maintenance record.
 * Business Rule #10: Closing restores vehicle to AVAILABLE, unless vehicle is RETIRED.
 */
async function closeMaintenance(id) {
  const log = await getMaintenanceById(id);
  if (log.status === 'CLOSED') {
    throw new AppError('Maintenance record is already closed.', 409, 'ALREADY_CLOSED');
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicle_id } });
  const newVehicleStatus = vehicle.status === 'RETIRED' ? 'RETIRED' : 'AVAILABLE';

  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id },
      data: { status: 'CLOSED', closed_at: new Date() },
      include: { vehicle: { select: { id: true, registration_number: true, name_model: true } } },
    }),
    prisma.vehicle.update({ where: { id: log.vehicle_id }, data: { status: newVehicleStatus } }),
  ]);

  return updatedLog;
}

module.exports = { listMaintenance, getMaintenanceById, createMaintenance, closeMaintenance };
