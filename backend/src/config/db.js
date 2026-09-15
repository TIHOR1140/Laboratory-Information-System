const { Pool } = require('pg')
const { databaseUrl, dbHost, dbPort, dbName, dbUser, dbPassword } = require('./env')

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL === 'true' || databaseUrl.includes('supabase') || databaseUrl.includes('render') || databaseUrl.includes('neon') ? { rejectUnauthorized: false } : false,
    }
  : {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
    }

const pool = new Pool(poolConfig)

module.exports = pool
