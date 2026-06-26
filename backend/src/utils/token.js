const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn } = require('../config/env')

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  )
}

module.exports = {
  signToken,
}
