const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { verifyToken } = require('../utils/jwt')

async function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return next(new HttpError(401, 'Authentication token is required.'))
  }

  try {
    const payload = verifyToken(token)

    // Verify session jti exists and is active in database
    if (payload.jti) {
      const sessionResult = await pool.query(
        'SELECT is_revoked, expires_at FROM user_sessions WHERE jti = $1',
        [payload.jti]
      )
      const session = sessionResult.rows[0]
      if (!session || session.is_revoked || new Date() > new Date(session.expires_at)) {
        return next(new HttpError(401, 'Session has been revoked or expired.'))
      }
    }

    req.auth = payload
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