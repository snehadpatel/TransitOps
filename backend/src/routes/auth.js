const { z } = require('zod');
const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/register — disabled; roles must not be self-assigned
router.post('/register', authController.register);

module.exports = router;
