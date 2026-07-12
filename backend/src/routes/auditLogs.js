const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { paginate } = require('../utils/pagination');

const router = Router();

const ACTION_BY_RESOURCE = {
  vehicles: 'CREATE',
  drivers: 'CREATE',
  trips: 'UPDATE',
  maintenance: 'UPDATE',
  fuel: 'CREATE',
  expenses: 'CREATE',
  users: 'LOGIN',
};

function inDateRange(createdAt, startDate, endDate) {
  const ts = new Date(createdAt).getTime();
  if (startDate && ts < new Date(startDate).getTime()) return false;
  if (endDate && ts > new Date(`${endDate}T23:59:59.999Z`).getTime()) return false;
  return true;
}

router.use(authenticate);
router.use(requireRole('FLEET_MANAGER'));

router.get('/', async (req, res, next) => {
  try {
    const [users, vehicles, drivers, trips, maintenance, fuel, expenses] = await Promise.all([
      prisma.user.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.vehicle.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.driver.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.trip.findMany({ orderBy: { updated_at: 'desc' }, take: 20 }),
      prisma.maintenanceLog.findMany({ orderBy: { updated_at: 'desc' }, take: 20 }),
      prisma.fuelLog.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.expense.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
    ]);

    const actor = {
      user_name: req.user.name || 'System',
      user_email: req.user.email || 'system@transitops.local',
      ip_address: req.ip,
    };

    const logs = [
      ...users.map((user) => ({
        id: `user-${user.id}`,
        ...actor,
        action: 'LOGIN',
        resource: 'users',
        resource_id: user.id,
        details: `${user.name} account available with ${user.role} access`,
        created_at: user.created_at,
      })),
      ...vehicles.map((vehicle) => ({
        id: `vehicle-${vehicle.id}`,
        ...actor,
        action: 'CREATE',
        resource: 'vehicles',
        resource_id: vehicle.id,
        details: `${vehicle.registration_number} registered as ${vehicle.status}`,
        created_at: vehicle.created_at,
      })),
      ...drivers.map((driver) => ({
        id: `driver-${driver.id}`,
        ...actor,
        action: 'CREATE',
        resource: 'drivers',
        resource_id: driver.id,
        details: `${driver.name} driver profile is ${driver.status}`,
        created_at: driver.created_at,
      })),
      ...trips.map((trip) => ({
        id: `trip-${trip.id}`,
        ...actor,
        action: 'UPDATE',
        resource: 'trips',
        resource_id: trip.id,
        details: `${trip.trip_code} currently ${trip.status}`,
        created_at: trip.updated_at,
      })),
      ...maintenance.map((log) => ({
        id: `maintenance-${log.id}`,
        ...actor,
        action: log.status === 'CLOSED' ? 'UPDATE' : 'CREATE',
        resource: 'maintenance',
        resource_id: log.id,
        details: `${log.service_type} maintenance is ${log.status}`,
        created_at: log.updated_at,
      })),
      ...fuel.map((log) => ({
        id: `fuel-${log.id}`,
        ...actor,
        action: 'CREATE',
        resource: 'fuel',
        resource_id: log.id,
        details: `${log.liters} liters fuel logged`,
        created_at: log.created_at,
      })),
      ...expenses.map((expense) => ({
        id: `expense-${expense.id}`,
        ...actor,
        action: 'CREATE',
        resource: 'expenses',
        resource_id: expense.id,
        details: `${expense.category || 'Expense'} recorded for ${expense.total}`,
        created_at: expense.created_at,
      })),
    ].filter((log) => {
      if (req.query.action && log.action !== req.query.action) return false;
      if (req.query.resource && log.resource !== req.query.resource) return false;
      if (!inDateRange(log.created_at, req.query.startDate, req.query.endDate)) return false;
      const haystack = `${log.user_name} ${log.user_email} ${log.details} ${log.resource}`.toLowerCase();
      return !req.query.search || haystack.includes(String(req.query.search).toLowerCase());
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const { skip, take, meta } = paginate(req.query.page, req.query.limit);
    res.json({ data: logs.slice(skip, skip + take), meta: meta(logs.length) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
