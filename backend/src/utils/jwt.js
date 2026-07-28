const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn } = require('../config/env')

function signToken(user, jti) {
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  }
  if (jti) {
    payload.jti = jti
  }
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
}

function signTempToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      twoFactor: true,
    },
    jwtSecret,
    { expiresIn: '5m' },
  )
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret)
}

module.exports = {
  signToken,
  signTempToken,
  verifyToken,
}