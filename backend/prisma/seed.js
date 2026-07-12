/**
 * Prisma seed script.
 * Run with: node prisma/seed.js (or npm run seed)
 * Idempotent — safe to run multiple times.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TransitOps database...');

  // ─── Users (one per role) ─────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('Password123', 12);

  const users = [
    { name: 'Maya Fleet', email: 'manager@transitops.com', role: 'FLEET_MANAGER' },
    { name: 'Dev Dispatch', email: 'dispatcher@transitops.com', role: 'DISPATCHER' },
    { name: 'Sara Safety', email: 'safety@transitops.com', role: 'SAFETY_OFFICER' },
    { name: 'Finn Finance', email: 'analyst@transitops.com', role: 'FINANCIAL_ANALYST' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password_hash: passwordHash },
    });
  }
  console.log('✅ Users seeded (4 roles)');

  // ─── Vehicles ─────────────────────────────────────────────────────────────

  const vehicleData = [
    {
      registration_number: 'VAN-05',
      name_model: 'Toyota HiAce',
      type: 'VAN',
      max_load_capacity: 500,
      odometer: 12500,
      acquisition_cost: 850000,
      status: 'AVAILABLE',
      region: 'North',
      insurance_expiry: new Date('2026-07-22'),
    },
    {
      registration_number: 'TRK-12',
      name_model: 'Tata Prima 4930.S',
      type: 'TRUCK',
      max_load_capacity: 5000,
      odometer: 87400,
      acquisition_cost: 3500000,
      status: 'AVAILABLE',
      region: 'South',
      insurance_expiry: new Date('2026-09-15'),
    },
    {
      registration_number: 'BUS-03',
      name_model: 'Volvo 9400',
      type: 'BUS',
      max_load_capacity: 2000,
      odometer: 54200,
      acquisition_cost: 6000000,
      status: 'IN_SHOP',
      region: 'East',
      insurance_expiry: new Date('2026-08-04'),
    },
    {
      registration_number: 'VAN-07',
      name_model: 'Mahindra Supro',
      type: 'VAN',
      max_load_capacity: 600,
      odometer: 33100,
      acquisition_cost: 720000,
      status: 'AVAILABLE',
      region: 'West',
      insurance_expiry: new Date('2026-10-01'),
    },
    {
      registration_number: 'TRK-08',
      name_model: 'Ashok Leyland Captain',
      type: 'TRUCK',
      max_load_capacity: 8000,
      odometer: 210000,
      acquisition_cost: 2800000,
      status: 'RETIRED',
      region: 'North',
      insurance_expiry: new Date('2025-12-31'),
    },
  ];

  for (const v of vehicleData) {
    await prisma.vehicle.upsert({
      where: { registration_number: v.registration_number },
      update: v,
      create: v,
    });
  }
  console.log('✅ Vehicles seeded (5 vehicles)');

  // ─── Drivers ──────────────────────────────────────────────────────────────

  const driverData = [
    {
      name: 'Alex Kumar',
      license_number: 'DL-MH-2019-0042',
      license_category: 'LMV-TR',
      license_expiry: new Date('2028-06-30'),
      contact_number: '+91-9876543210',
      safety_score: 94.5,
      status: 'AVAILABLE',
    },
    {
      name: 'Priya Sharma',
      license_number: 'DL-KA-2020-0118',
      license_category: 'HMV',
      license_expiry: new Date('2027-03-15'),
      contact_number: '+91-9988776655',
      safety_score: 87.0,
      status: 'AVAILABLE',
    },
    {
      name: 'Rajan Nair',
      license_number: 'DL-TN-2018-0377',
      license_category: 'HMV',
      license_expiry: new Date('2025-01-01'), // expired — tests rule #3
      contact_number: '+91-9000011112',
      safety_score: 72.0,
      status: 'AVAILABLE',
    },
    {
      name: 'Sunita Mehta',
      license_number: 'DL-GJ-2021-0543',
      license_category: 'LMV-TR',
      license_expiry: new Date('2029-12-31'),
      contact_number: '+91-9123456789',
      safety_score: 99.0,
      status: 'SUSPENDED',  // suspended — tests rule #3
    },
  ];

  for (const d of driverData) {
    await prisma.driver.upsert({
      where: { license_number: d.license_number },
      update: {},
      create: d,
    });
  }
  console.log('✅ Drivers seeded (4 drivers, including 1 expired + 1 suspended for testing)');

  // ─── Settings ─────────────────────────────────────────────────────────────

  await prisma.setting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      depot_name: 'TransitOps Central Depot',
      currency: 'INR',
      distance_unit: 'km',
    },
  });
  console.log('✅ Settings seeded');

  // ─── Sample Completed Trip + Fuel Log (for Analytics to show real data) ───

  const van05 = await prisma.vehicle.findUnique({ where: { registration_number: 'VAN-05' } });
  const alexKumar = await prisma.driver.findUnique({ where: { license_number: 'DL-MH-2019-0042' } });

  const existingTrip = await prisma.trip.findFirst({
    where: { trip_code: 'TRIP-SEED-001' },
  });

  if (!existingTrip) {
    const seedTrip = await prisma.trip.create({
      data: {
        trip_code: 'TRIP-SEED-001',
        source: 'Mumbai Central',
        destination: 'Pune Station',
        vehicle_id: van05.id,
        driver_id: alexKumar.id,
        cargo_weight: 300,
        planned_distance: 148,
        status: 'COMPLETED',
        final_odometer: 12648,
        fuel_consumed: 18.5,
        started_at: new Date(Date.now() - 86400000 * 2),
        completed_at: new Date(Date.now() - 86400000),
      },
    });

    await prisma.fuelLog.create({
      data: {
        vehicle_id: van05.id,
        trip_id: seedTrip.id,
        liters: 18.5,
        cost: 2220,
        date: new Date(Date.now() - 86400000),
      },
    });

    await prisma.maintenanceLog.create({
      data: {
        vehicle_id: van05.id,
        service_type: 'Oil Change',
        cost: 3500,
        status: 'CLOSED',
        notes: 'Routine 5000km service',
        closed_at: new Date(Date.now() - 86400000 * 5),
        date: new Date(Date.now() - 86400000 * 7),
      },
    });

    console.log('✅ Sample completed trip, fuel log, and maintenance record seeded');
  }

  console.log('\n🎉 Database seeding complete!');
  console.log('\nDefault credentials (all passwords: Password123):');
  console.log('  manager@transitops.com   → Fleet Manager');
  console.log('  dispatcher@transitops.com → Dispatcher');
  console.log('  safety@transitops.com    → Safety Officer');
  console.log('  analyst@transitops.com   → Financial Analyst');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
