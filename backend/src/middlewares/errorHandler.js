const { Prisma } = require('@prisma/client');

/**
 * Custom application error with HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [code] - machine-readable error code
   */
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Centralized Express error handler.
 * Maps Prisma errors and AppErrors to consistent JSON responses.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Duplicate unique constraint (e.g. registration_number)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      return res.status(409).json({
        error: `A record with this ${field} already exists.`,
        code: 'DUPLICATE_' + field.toUpperCase(),
        field,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found.', code: 'NOT_FOUND' });
    }
    return res.status(400).json({ error: 'Database error.', code: err.code });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token has expired.', code: 'TOKEN_EXPIRED' });
  }

  // Application-level errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Fallback — never leak stack traces in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message;
  return res.status(statusCode).json({ error: message, code: 'INTERNAL_ERROR' });
}

module.exports = { AppError, errorHandler };
