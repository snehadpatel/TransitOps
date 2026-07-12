const prisma = require('../utils/prismaClient');
const { AppError } = require('../middlewares/errorHandler');
const { paginate } = require('../utils/pagination');

async function listExpenses({ page, limit, vehicle_id, trip_id }) {
  const { skip, take, meta } = paginate(page, limit);
  const where = {
    ...(vehicle_id && { vehicle_id }),
    ...(trip_id && { trip_id }),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where, skip, take,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, registration_number: true, name_model: true } },
        trip: { select: { id: true, trip_code: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return { data: expenses, meta: meta(total) };
}

async function createExpense(data) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
  if (!vehicle) throw new AppError('Vehicle not found.', 404, 'NOT_FOUND');

  const toll = parseFloat(data.toll) || 0;
  const other = parseFloat(data.other) || 0;
  const total = toll + other;

  return prisma.expense.create({
    data: { ...data, toll, other, total },
    include: {
      vehicle: { select: { id: true, registration_number: true, name_model: true } },
      trip: { select: { id: true, trip_code: true } },
    },
  });
}

async function updateExpense(id, data) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new AppError('Expense not found.', 404, 'NOT_FOUND');

  const toll = data.toll !== undefined ? parseFloat(data.toll) : expense.toll;
  const other = data.other !== undefined ? parseFloat(data.other) : expense.other;

  return prisma.expense.update({
    where: { id },
    data: { ...data, toll, other, total: toll + other },
  });
}

async function deleteExpense(id) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new AppError('Expense not found.', 404, 'NOT_FOUND');
  return prisma.expense.delete({ where: { id } });
}

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense };
