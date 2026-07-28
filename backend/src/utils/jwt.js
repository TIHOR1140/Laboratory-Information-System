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

function verifyToken(token) {
  return jwt.verify(token, jwtSecret)
}

module.exports = {
  signToken,
  verifyToken,
}