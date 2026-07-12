const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middlewares/auth');

const router = Router();

function getAccessibleScopes(role) {
  if (role === 'FLEET_MANAGER') return { vehicles: true, drivers: true, trips: true };
  if (role === 'DISPATCHER') return { vehicles: true, drivers: true, trips: true };
  if (role === 'SAFETY_OFFICER') return { vehicles: false, drivers: true, trips: true };
  if (role === 'FINANCIAL_ANALYST') return { vehicles: true, drivers: false, trips: false };
  return { vehicles: false, drivers: false, trips: false };
}

router.use(authenticate);

router.get('/search', async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '').trim();
    if (query.length < 2) {
      return res.json({ vehicles: [], drivers: [], trips: [] });
    }

    const scopes = getAccessibleScopes(req.user.role);
    const like = { contains: query, mode: 'insensitive' };

    const [vehicles, drivers, trips] = await Promise.all([
      scopes.vehicles
        ? prisma.vehicle.findMany({
            where: {
              OR: [
                { registration_number: like },
                { name_model: like },
                { region: like },
              ],
            },
            take: 5,
            orderBy: { updated_at: 'desc' },
            select: { id: true, registration_number: true, name_model: true, status: true },
          })
        : [],
      scopes.drivers
        ? prisma.driver.findMany({
            where: {
              OR: [
                { name: like },
                { license_number: like },
                { license_category: like },
              ],
            },
            take: 5,
            orderBy: { updated_at: 'desc' },
            select: { id: true, name: true, license_number: true, status: true },
          })
        : [],
      scopes.trips
        ? prisma.trip.findMany({
            where: {
              OR: [
                { trip_code: like },
                { source: like },
                { destination: like },
              ],
            },
            take: 5,
            orderBy: { created_at: 'desc' },
            select: { id: true, trip_code: true, source: true, destination: true, status: true },
          })
        : [],
    ]);

    return res.json({ vehicles, drivers, trips });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;