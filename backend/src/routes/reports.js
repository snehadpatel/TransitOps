const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

const router = Router();

function dateRange(field, startDate, endDate) {
  if (!startDate && !endDate) return {};
  return {
    [field]: {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
    },
  };
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

router.use(authenticate);
router.use(requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'));

router.get('/trips', async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        ...(req.query.status ? { status: req.query.status } : {}),
        ...dateRange('created_at', req.query.startDate, req.query.endDate),
      },
      orderBy: { created_at: 'desc' },
      include: {
        vehicle: { select: { registration_number: true, name_model: true } },
        driver: { select: { name: true } },
        fuel_logs: { select: { cost: true } },
        expenses: { select: { total: true } },
      },
    });

    res.json(trips.map((trip) => ({
      'Trip Code': trip.trip_code,
      Source: trip.source,
      Destination: trip.destination,
      Vehicle: `${trip.vehicle.registration_number} (${trip.vehicle.name_model})`,
      Driver: trip.driver.name,
      Status: trip.status,
      Date: trip.created_at.toISOString().slice(0, 10),
      Distance: trip.planned_distance,
      Cost: money(
        trip.fuel_logs.reduce((sum, log) => sum + (log.cost || 0), 0) +
        trip.expenses.reduce((sum, expense) => sum + (expense.total || 0), 0)
      ),
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/expenses', async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: dateRange('date', req.query.startDate, req.query.endDate),
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { registration_number: true } } },
    });
    res.json(expenses.map((expense) => ({
      Vehicle: expense.vehicle.registration_number,
      Category: expense.category || 'Expense',
      Toll: money(expense.toll),
      Other: money(expense.other),
      Total: money(expense.total),
      Date: expense.date.toISOString().slice(0, 10),
      Notes: expense.notes || '',
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/fuel', async (req, res, next) => {
  try {
    const logs = await prisma.fuelLog.findMany({
      where: dateRange('date', req.query.startDate, req.query.endDate),
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { registration_number: true } },
        trip: { select: { planned_distance: true, driver: { select: { name: true } } } },
      },
    });
    res.json(logs.map((log) => ({
      Vehicle: log.vehicle.registration_number,
      Date: log.date.toISOString().slice(0, 10),
      Liters: log.liters,
      Cost: money(log.cost),
      Efficiency: log.trip && log.liters > 0 ? `${(log.trip.planned_distance / log.liters).toFixed(2)} km/L` : 'N/A',
      Driver: log.trip?.driver?.name || 'N/A',
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/maintenance', async (req, res, next) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: dateRange('date', req.query.startDate, req.query.endDate),
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { registration_number: true, name_model: true } } },
    });
    res.json(logs.map((log) => ({
      Vehicle: `${log.vehicle.registration_number} (${log.vehicle.name_model})`,
      'Service Type': log.service_type,
      Cost: money(log.cost),
      Date: log.date.toISOString().slice(0, 10),
      Status: log.status,
      Notes: log.notes || '',
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/drivers', async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { safety_score: 'desc' },
      include: { _count: { select: { trips: true } } },
    });
    res.json(drivers.map((driver) => ({
      Driver: driver.name,
      License: driver.license_number,
      Category: driver.license_category,
      Trips: driver._count.trips,
      'Safety Score': driver.safety_score,
      Status: driver.status,
    })));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
