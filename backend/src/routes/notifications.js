const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

function daysUntil(date) {
  const start = new Date().setHours(0, 0, 0, 0);
  const target = new Date(date).setHours(0, 0, 0, 0);
  return Math.ceil((target - start) / (1000 * 60 * 60 * 24));
}

function buildNotifications({ drivers, maintenance, trips }) {
  const notifications = [];

  drivers.forEach((driver) => {
    const days = daysUntil(driver.license_expiry);
    if (days <= 30) {
      notifications.push({
        id: `driver-${driver.id}`,
        type: 'LICENSE_EXPIRY',
        title: 'Driver License Expiring',
        message: `${driver.name}'s license expires in ${days < 0 ? 'expired' : `${days} days`}`,
        isRead: false,
        createdAt: driver.license_expiry.toISOString(),
        link: '/drivers',
      });
    }
  });

  maintenance.forEach((log) => {
    notifications.push({
      id: `maintenance-${log.id}`,
      type: 'MAINTENANCE_DUE',
      title: 'Maintenance Open',
      message: `${log.vehicle.registration_number} is currently in maintenance for ${log.service_type}`,
      isRead: false,
      createdAt: log.created_at.toISOString(),
      link: '/maintenance',
    });
  });

  trips.forEach((trip) => {
    notifications.push({
      id: `trip-${trip.id}`,
      type: 'TRIP_UPDATE',
      title: `Trip ${trip.status.toLowerCase()}`,
      message: `${trip.trip_code} from ${trip.source} to ${trip.destination} is ${trip.status.toLowerCase()}.`,
      isRead: trip.status === 'COMPLETED',
      createdAt: trip.updated_at.toISOString(),
      link: '/trips',
    });
  });

  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}

router.get('/notifications', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const [drivers, maintenance, trips] = await Promise.all([
      prisma.driver.findMany({
        where: {
          status: 'AVAILABLE',
          license_expiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        take: limit,
        orderBy: { license_expiry: 'asc' },
        select: { id: true, name: true, license_expiry: true },
      }),
      prisma.maintenanceLog.findMany({
        where: { status: 'ACTIVE' },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { vehicle: { select: { registration_number: true } } },
      }),
      prisma.trip.findMany({
        take: limit,
        orderBy: { updated_at: 'desc' },
        select: { id: true, trip_code: true, source: true, destination: true, status: true, updated_at: true },
      }),
    ]);

    const vehiclesWithInsurance = await prisma.vehicle.findMany({
      where: {
        status: { not: 'RETIRED' },
        insurance_expiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      take: limit,
      orderBy: { insurance_expiry: 'asc' },
      select: { id: true, registration_number: true, name_model: true, insurance_expiry: true },
    });

    const notifications = buildNotifications({ drivers, maintenance, trips });
    vehiclesWithInsurance.forEach((vehicle) => {
      const days = daysUntil(vehicle.insurance_expiry);
      notifications.push({
        id: `insurance-${vehicle.id}`,
        type: 'INSURANCE_EXPIRY',
        title: 'Vehicle Insurance Expiring',
        message: `${vehicle.registration_number} insurance expires in ${days < 0 ? 'expired' : `${days} days`}`,
        isRead: false,
        createdAt: vehicle.insurance_expiry.toISOString(),
        link: '/fleet',
      });
    });

    return res.json(notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit));
  } catch (error) {
    return next(error);
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  return res.json({ success: true, id: req.params.id });
});

router.post('/notifications/mark-all-read', async (req, res) => {
  return res.json({ success: true });
});

module.exports = router;