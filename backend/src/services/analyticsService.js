const prisma = require('../utils/prismaClient');

/**
 * Dashboard KPIs — aggregated stats for the landing page.
 */
async function getDashboardKPIs() {
  const [
    totalVehicles,
    availableVehicles,
    inMaintenanceVehicles,
    onTripVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    recentTrips,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
    prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    prisma.vehicle.count({ where: { status: 'RETIRED' } }),
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
  ]);

  const fleetUtilization =
    totalVehicles > 0 ? Math.round((onTripVehicles / totalVehicles) * 100) : 0;

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
    },
    vehicleStatusBreakdown: {
      available: availableVehicles,
      onTrip: onTripVehicles,
      inShop: inMaintenanceVehicles,
      retired: retiredVehicles,
    },
    recentTrips,
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
