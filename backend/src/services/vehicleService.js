const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

/**
 * Returns paginated list of vehicles with optional filters.
 */
async function listVehicles({ page, limit, status, type, region, search }) {
  const { skip, take, meta } = paginate(page, limit);

  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(region && { region }),
    ...(search && {
      OR: [
        { name_model: { contains: search, mode: 'insensitive' } },
        { registration_number: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take, orderBy: { created_at: 'desc' } }),
    prisma.vehicle.count({ where }),
  ]);

  return { data: vehicles, meta: meta(total) };
}

/**
 * Returns AVAILABLE vehicles only — for the trip dispatcher dropdown.
 * Business Rule #2: Retired or In Shop vehicles must never appear here.
 */
async function getAvailableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { name_model: 'asc' },
  });
}

async function getVehicleById(id) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');
  return vehicle;
}

async function createVehicle(data) {
  return prisma.vehicle.create({ data });
}

async function updateVehicle(id, data) {
  await getVehicleById(id); // ensure exists
  return prisma.vehicle.update({ where: { id }, data });
}

/**
 * Soft-delete: set status to RETIRED.
 */
async function deleteVehicle(id) {
  const vehicle = await getVehicleById(id);
  if (vehicle.status === 'ON_TRIP') {
    throw new AppError('Cannot retire a vehicle that is currently On Trip.', 409, 'VEHICLE_ON_TRIP');
  }
  return prisma.vehicle.update({ where: { id }, data: { status: 'RETIRED' } });
}

async function getDocuments(vehicleId) {
  return prisma.document.findMany({ where: { vehicle_id: vehicleId }, orderBy: { uploaded_at: 'desc' } });
}

async function addDocument(vehicleId, url, name) {
  await getVehicleById(vehicleId); // ensure vehicle exists
  return prisma.document.create({
    data: {
      vehicle_id: vehicleId,
      url,
      name,
    }
  });
}

module.exports = {
  listVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDocuments,
  addDocument,
};
