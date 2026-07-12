const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { Router } = require('express');
const prisma = require('../utils/prismaClient');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { validate, validateQuery } = require('../middlewares/validate');
const { paginate } = require('../utils/pagination');
const { AppError } = require('../middlewares/errorHandler');

const router = Router();

const ROLE_DISPLAY = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

const DISPLAY_ROLE = Object.fromEntries(Object.entries(ROLE_DISPLAY).map(([raw, display]) => [display, raw]));
const VALID_ROLES = Object.keys(ROLE_DISPLAY);

function normalizeRole(role) {
  return DISPLAY_ROLE[role] || role;
}

function userStatus(user) {
  return user.locked_until && user.locked_until > new Date() ? 'INACTIVE' : 'ACTIVE';
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: ROLE_DISPLAY[user.role] || user.role,
    status: userStatus(user),
    createdAt: user.created_at,
  };
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.string().transform(normalizeRole).refine((role) => VALID_ROLES.includes(role), 'Invalid role.'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().transform(normalizeRole).refine((role) => VALID_ROLES.includes(role), 'Invalid role.').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

router.use(authenticate);
router.use(requireRole('FLEET_MANAGER'));

router.get('/', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    const { skip, take, meta } = paginate(req.query.page, req.query.limit);
    const role = req.query.role ? normalizeRole(req.query.role) : undefined;
    const search = req.query.search?.trim();
    const where = {
      ...(role && VALID_ROLES.includes(role) ? { role } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { created_at: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users.map(serializeUser), meta: meta(total) });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const password_hash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email.toLowerCase(),
        password_hash,
        role: req.body.role,
        locked_until: req.body.status === 'INACTIVE' ? new Date('9999-12-31T00:00:00.000Z') : null,
      },
    });
    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const data = {
      ...(req.body.name ? { name: req.body.name } : {}),
      ...(req.body.role ? { role: req.body.role } : {}),
      ...(req.body.status ? {
        locked_until: req.body.status === 'INACTIVE' ? new Date('9999-12-31T00:00:00.000Z') : null,
        failed_attempts: req.body.status === 'ACTIVE' ? 0 : undefined,
      } : {}),
    };
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw new AppError('You cannot delete your own account.', 409, 'CANNOT_DELETE_SELF');
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
