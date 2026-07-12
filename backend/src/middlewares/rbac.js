const { AppError } = require('./errorHandler');

/**
 * Middleware factory: restricts endpoint to specified roles.
 * Must be used AFTER authenticate middleware.
 * @param {...string} roles - allowed role strings (e.g. 'FLEET_MANAGER', 'DISPATCHER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
}

/**
 * Middleware: allows read-only access for listed roles, blocks write.
 * Used to surface helpful 403 messages on view-only routes.
 */
function readOnly(req, res, next) {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeMethods.includes(req.method)) {
    return next(new AppError('You have read-only access to this resource.', 403, 'READ_ONLY'));
  }
  next();
}

module.exports = { requireRole, readOnly };
