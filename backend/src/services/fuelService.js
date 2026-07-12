const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

async function listFuelLogs({ page, limit, vehicle_id, trip_id }) {
  const { skip, take, meta } = paginate(page, limit);
  const where = {
    ...(vehicle_id && { vehicle_id }),
    ...(trip_id && { trip_id }),
  };

  const [logs, total] = await Promise.all([
    prisma.fuelLog.findMany({
      where, skip, take,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        trip: { select: { id: true, trip_code: true } },
      },
    }),
    prisma.fuelLog.count({ where }),
  ]);

  return { data: logs, meta: meta(total) };
}

async function createFuelLog(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');

  return prisma.fuelLog.create({
    data,
    include: {
      vehicle: { select: { id: true, registration_number: true, name_model: true } },
      trip: { select: { id: true, trip_code: true } },
    },
  });
}

async function updateFuelLog(id, data) {
  const log = await prisma.fuelLog.findUnique({ where: { id } });
  if (!log) throw new AppError('Fuel log not found.', 404, 'NOT_FOUND');
  return prisma.fuelLog.update({ where: { id }, data });
}

async function deleteFuelLog(id) {
  const log = await prisma.fuelLog.findUnique({ where: { id } });
  if (!log) throw new AppError('Fuel log not found.', 404, 'NOT_FOUND');
  return prisma.fuelLog.delete({ where: { id } });
}

module.exports = { listFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog };
