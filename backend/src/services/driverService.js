const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

async function listDrivers({ page, limit, status, search }) {
  const { skip, take, meta } = paginate(page, limit);

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { license_number: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({ where, skip, take, orderBy: { created_at: 'desc' } }),
    prisma.driver.count({ where }),
  ]);

  return { data: drivers, meta: meta(total) };
}

/**
 * Returns drivers eligible for trip assignment.
 * Business Rule #3: Expired license or Suspended status blocks assignment.
 * Business Rule #4: ON_TRIP drivers cannot be assigned.
 */
async function getAvailableDrivers() {
  const now = new Date();
  return prisma.driver.findMany({
    where: {
      status: 'AVAILABLE',
      license_expiry: { gt: now },
    },
    orderBy: { name: 'asc' },
  });
}

async function getDriverById(id) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new AppError('Driver not found.', 404, 'NOT_FOUND');
  return driver;
}

async function createDriver(data) {
  return prisma.driver.create({ data });
}

async function updateDriver(id, data) {
  await getDriverById(id);
  return prisma.driver.update({ where: { id }, data });
}

async function deleteDriver(id) {
  const driver = await getDriverById(id);
  if (driver.status === 'ON_TRIP') {
    throw new AppError('Cannot delete a driver currently On Trip.', 409, 'DRIVER_ON_TRIP');
  }
  return prisma.driver.delete({ where: { id } });
}

module.exports = {
  listDrivers, getAvailableDrivers, getDriverById,
  createDriver, updateDriver, deleteDriver,
};
