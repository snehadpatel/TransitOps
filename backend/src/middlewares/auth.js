const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');

/**
 * Middleware: verifies JWT from Authorization header.
 * Attaches decoded { id, role } to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHENTICATED'));
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
