const dotenv = require('dotenv')

dotenv.config()

const required = ['JWT_SECRET', 'DATABASE_URL']
const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.warn(`Missing environment variables: ${missing.join(', ')}`)
}

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  databaseUrl: process.env.DATABASE_URL || '',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: process.env.DB_NAME || 'lis_db',
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
}
