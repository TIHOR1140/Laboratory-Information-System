const { Pool } = require('pg')
const { databaseUrl, dbHost, dbPort, dbName, dbUser, dbPassword } = require('./env')

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
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
