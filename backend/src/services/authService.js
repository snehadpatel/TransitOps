const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middlewares/errorHandler');

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Authenticates a user. Enforces 5-attempt lockout.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Check lockout
  if (user.locked_until && user.locked_until > new Date()) {
    const mins = Math.ceil((user.locked_until - new Date()) / 60000);
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${mins} minute(s).`,
      403,
      'ACCOUNT_LOCKED'
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const newAttempts = user.failed_attempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_attempts: newAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      throw new AppError(
        `Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
        403,
        'ACCOUNT_LOCKED'
      );
    }

    throw new AppError(
      `Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Reset failed attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failed_attempts: 0, locked_until: null },
  });

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Returns the current user by ID (from JWT payload).
 * @param {string} userId
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  return user;
}

async function register() {
  throw new AppError(
    'Public registration is disabled. Use administrator-provisioned accounts.',
    403,
    'REGISTRATION_DISABLED'
  );
}

module.exports = { login, getMe, register };
