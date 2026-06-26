const HttpError = require('../utils/httpError')

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500

  if (statusCode >= 500) {
    console.error(err)
  }

  return res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected error occurred.' : err.message,
    ...(err.details ? { errors: err.details } : {}),
  })
}

module.exports = {
  notFound,
  errorHandler,
}