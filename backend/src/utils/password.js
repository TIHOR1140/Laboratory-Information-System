const bcrypt = require('bcrypt')
const { bcryptRounds } = require('../config/env')

async function hashPassword(password) {
  return bcrypt.hash(password, bcryptRounds)
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

module.exports = {
  hashPassword,
  comparePassword,
}