const HttpError = require('../utils/httpError')
const { verifyToken } = require('../utils/jwt')

function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return next(new HttpError(401, 'Authentication token is required.'))
  }

  try {
    req.auth = verifyToken(token)
    return next()
  } catch {
    return next(new HttpError(401, 'Invalid or expired authentication token.'))
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new HttpError(401, 'Authentication required.'))
    }

    if (!roles.includes(req.auth.role)) {
      return next(new HttpError(403, 'You are not allowed to access this resource.'))
    }

    return next()
  }
}

module.exports = {
  authenticate,
  authorizeRoles,
}