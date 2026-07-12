const prisma = require('../utils/prismaClient');

const MONTHS_TO_SHOW = 6;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

function daysUntil(date) {
  const start = new Date().setHours(0, 0, 0, 0);
  const target = new Date(date).setHours(0, 0, 0, 0);
  return Math.ceil((target - start) / (1000 * 60 * 60 * 24));
}

/**
 * Dashboard KPIs — aggregated stats for the landing page.
 */
async function getDashboardKPIs() {
  const now = new Date();
  const sixMonthsAgo = startOfMonth(addMonths(now, -(MONTHS_TO_SHOW - 1)));

  const [
    completedTrips,
    totalVehicles,
    availableVehicles,
    inMaintenanceVehicles,
    onTripVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    recentTrips,
    upcomingMaintenance,
    licenseAlerts,
    latestExpenses,
    latestFuelLogs,
    tripsForTrend,
    fuelLogsForTrend,
    maintenanceForTrend,
    expensesForTrend,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'RETIRED' } }),
    prisma.trip.findMany({
      where: { status: 'COMPLETED' },
      select: { id: true },
    }),
    prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    prisma.trip.count({ where: { status: 'DRAFT' } }),
    prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
    prisma.trip.findMany({
      where: { status: { in: ['DISPATCHED', 'DRAFT'] } },
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        vehicle: { select: { registration_number: true, name_model: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.maintenanceLog.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
      orderBy: { date: 'asc' },
      include: { vehicle: { select: { registration_number: true, name_model: true } } },
    }),
    prisma.driver.findMany({
      where: {
        status: 'AVAILABLE',
        license_expiry: { lte: addMonths(now, 1) },
      },
      take: 5,
      orderBy: { license_expiry: 'asc' },
      select: { id: true, name: true, license_number: true, license_expiry: true },
    }),
    prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { registration_number: true, name_model: true } } },
    }),
    prisma.fuelLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { vehicle: { select: { registration_number: true, name_model: true } } },
    }),
    prisma.vehicle.findMany({
      where: {
        status: { not: 'RETIRED' },
        insurance_expiry: { lte: addMonths(now, 1) },
      },
      take: 5,
      orderBy: { insurance_expiry: 'asc' },
      select: { id: true, registration_number: true, name_model: true, insurance_expiry: true },
    }),
    prisma.trip.findMany({ where: { created_at: { gte: sixMonthsAgo } }, select: { created_at: true } }),
    prisma.fuelLog.findMany({ where: { date: { gte: sixMonthsAgo } }, select: { date: true, liters: true } }),
    prisma.maintenanceLog.findMany({ where: { date: { gte: sixMonthsAgo } }, select: { date: true, cost: true } }),
    prisma.expense.findMany({ where: { date: { gte: sixMonthsAgo } }, select: { date: true, total: true } }),
  ]);

  const fleetUtilization =
    totalVehicles > 0 ? Math.round((onTripVehicles / totalVehicles) * 100) : 0;

  const monthlyData = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const monthStart = startOfMonth(addMonths(sixMonthsAgo, index));
    const monthEnd = addMonths(monthStart, 1);
    const trips = tripsForTrend.filter((trip) => trip.created_at >= monthStart && trip.created_at < monthEnd).length;
    const fuel = fuelLogsForTrend
      .filter((log) => log.date >= monthStart && log.date < monthEnd)
      .reduce((sum, log) => sum + (log.liters ?? 0), 0);
    const maintenance = maintenanceForTrend
      .filter((log) => log.date >= monthStart && log.date < monthEnd)
      .reduce((sum, log) => sum + (log.cost ?? 0), 0);
    const expenses = expensesForTrend
      .filter((expense) => expense.date >= monthStart && expense.date < monthEnd)
      .reduce((sum, expense) => sum + (expense.total ?? 0), 0);

    return {
      month: formatMonthLabel(monthStart),
      trips,
      fuel: Math.round(fuel),
      maintenance: Math.round(maintenance),
      expenses: Math.round(expenses),
    };
  });

  const monthlyFuelCost = fuelLogsForTrend.reduce((sum, log) => sum + (log.cost ?? 0), 0);
  const monthlyExpenses = expensesForTrend.reduce((sum, expense) => sum + (expense.total ?? 0), 0);
  const monthlyMaintenanceCost = maintenanceForTrend.reduce((sum, log) => sum + (log.cost ?? 0), 0);
  const totalOperationalCost = monthlyFuelCost + monthlyExpenses + monthlyMaintenanceCost;
  const totalRevenue = completedTrips.length * 10000;
  const totalProfit = totalRevenue - totalOperationalCost;

  return {
    kpis: {
      totalVehicles,
      availableVehicles,
      inMaintenanceVehicles,
      onTripVehicles,
      retiredVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      monthlyFuelCost,
      monthlyExpenses,
      totalOperationalCost,
      totalRevenue,
      totalProfit,
      monthlyMaintenanceCost,
    },
    vehicleStatusBreakdown: {
      available: availableVehicles,
      onTrip: onTripVehicles,
      inShop: inMaintenanceVehicles,
      retired: retiredVehicles,
    },
    recentTrips,
    upcomingMaintenance: upcomingMaintenance.map((log) => ({
      id: log.id,
      registration_number: log.vehicle.registration_number,
      service_type: log.service_type,
      start_date: log.date,
    })),
    licenseAlerts: licenseAlerts.map((driver) => ({
      id: driver.id,
      name: driver.name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      daysUntil: daysUntil(driver.license_expiry),
    })),
    insuranceAlerts: insuranceAlertsRaw.map((vehicle) => ({
      id: vehicle.id,
      registration_number: vehicle.registration_number,
      name_model: vehicle.name_model,
      insurance_expiry: vehicle.insurance_expiry,
      daysUntil: daysUntil(vehicle.insurance_expiry),
    })),
    latestExpenses: latestExpenses.map((expense) => ({
      id: expense.id,
      registration_number: expense.vehicle.registration_number,
      category: expense.category || 'Expense',
      amount: expense.total,
      date: expense.date,
    })),
    latestFuelLogs: latestFuelLogs.map((log) => ({
      id: log.id,
      registration_number: log.vehicle.registration_number,
      fuel_quantity: log.liters,
      fuel_cost: log.cost,
    })),
    monthlyData,
  };
}

/**
 * Reports & Analytics KPIs.
 * - Fuel Efficiency: total distance / total fuel
 * - Fleet Utilization: active vehicles / total vehicles
 * - Operational Cost: total fuel cost + total maintenance cost
 * - Vehicle ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost (summed across fleet)
 */
async function getReportsKPIs() {
  const [
    completedTrips,
    allFuelLogs,
    allMaintenance,
    allVehicles,
  ] = await Promise.all([
    prisma.trip.findMany({
      where: { status: 'COMPLETED' },
      select: { planned_distance: true, final_odometer: true, fuel_consumed: true },
    }),
    prisma.fuelLog.aggregate({ _sum: { liters: true, cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.vehicle.findMany({ select: { acquisition_cost: true } }),
  ]);

  const totalFuelLiters = allFuelLogs._sum.liters ?? 0;
  const totalFuelCost = allFuelLogs._sum.cost ?? 0;
  const totalMaintenanceCost = allMaintenance._sum.cost ?? 0;
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
  const totalAcquisitionCost = allVehicles.reduce((sum, v) => sum + v.acquisition_cost, 0);

  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.planned_distance ?? 0), 0);
  const fuelEfficiency = totalFuelLiters > 0
    ? parseFloat((totalDistance / totalFuelLiters).toFixed(2))
    : 0;

  // ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  // Revenue proxied as 0 since no revenue model in spec — display formula
  const roi = totalAcquisitionCost > 0
    ? parseFloat(((0 - totalOperationalCost) / totalAcquisitionCost * 100).toFixed(2))
    : 0;

  const totalVehicles = allVehicles.length;
  const [activeVehicles] = await Promise.all([
    prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
  ]);
  const fleetUtilization = totalVehicles > 0
    ? Math.round((activeVehicles / totalVehicles) * 100)
    : 0;

  return {
    fuelEfficiency,        // km/L
    fleetUtilization,      // %
    totalOperationalCost,  // currency
    roi,                   // %
    totalFuelLiters,
    totalFuelCost,
    totalMaintenanceCost,
    totalDistance,
    completedTrips: completedTrips.length,
  };
}

/**
 * Generates CSV from a list of objects.
 * @param {object[]} data
 * @returns {string}
 */
function generateCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

async function getReportsCSV() {
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: { select: { registration_number: true, name_model: true } },
      driver: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const rows = trips.map((t) => ({
    trip_code: t.trip_code,
    source: t.source,
    destination: t.destination,
    vehicle: t.vehicle.registration_number,
    driver: t.driver.name,
    cargo_weight: t.cargo_weight,
    planned_distance: t.planned_distance,
    fuel_consumed: t.fuel_consumed ?? '',
    status: t.status,
    created_at: t.created_at.toISOString(),
  }));

  return generateCSV(rows);
}

module.exports = { getDashboardKPIs, getReportsKPIs, getReportsCSV };
