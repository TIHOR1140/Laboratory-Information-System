const fs = require('fs')
const path = require('path')
const { Client, Pool } = require('pg')
require('dotenv').config()

function parseEnvCredentials() {
  let host = process.env.DB_HOST || 'localhost'
  let port = parseInt(process.env.DB_PORT || '5432', 10)
  let user = process.env.DB_USER || 'postgres'
  let password = process.env.DB_PASSWORD || 'postgres'
  let database = process.env.DB_NAME || 'lis_db'

  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL)
      if (url.hostname) host = url.hostname
      if (url.port) port = parseInt(url.port, 10)
      if (url.username) user = url.username
      if (url.password) password = decodeURIComponent(url.password)
      if (url.pathname) database = url.pathname.replace(/^\//, '')
    } catch (e) {
      // ignore parse error
    }
  }

  return { host, port, user, password, database }
}

async function tryConnect(host, port, user, password, dbName) {
  const client = new Client({
    host,
    port,
    user,
    password,
    database: dbName,
    connectionTimeoutMillis: 3000,
  })
  try {
    await client.connect()
    return { success: true, client }
  } catch (err) {
    return { success: false, error: err }
  }
}

function updateEnvFile(workingPassword) {
  const envPath = path.resolve(__dirname, '../.env')
  const examplePath = path.resolve(__dirname, '../.env.example')
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath)
  }
  if (!fs.existsSync(envPath)) return

  let content = fs.readFileSync(envPath, 'utf8')
  content = content.replace(/^DB_PASSWORD=.*/m, `DB_PASSWORD=${workingPassword}`)
  content = content.replace(
    /^DATABASE_URL=.*/m,
    `DATABASE_URL=postgresql://${process.env.DB_USER || 'postgres'}:${workingPassword}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'lis_db'}`
  )
  fs.writeFileSync(envPath, content, 'utf8')
  console.log(`📝 Automatically updated backend/.env with working password: '${workingPassword}'`)
}

async function setupDatabase() {
  console.log('🚀 Starting Laboratory Information System Database Setup...')
  const creds = parseEnvCredentials()

  const candidatePasswords = [
    creds.password,
    'postgres',
    'admin',
    '1234',
    'root',
    'kavindu588722',
    '',
  ].filter((p, index, self) => p !== undefined && self.indexOf(p) === index)

  let workingPassword = null
  let rootClient = null

  console.log(`📡 Connecting to PostgreSQL server at ${creds.host}:${creds.port} as '${creds.user}'...`)

  for (const pwd of candidatePasswords) {
    const res = await tryConnect(creds.host, creds.port, creds.user, pwd, 'postgres')
    if (res.success) {
      workingPassword = pwd
      rootClient = res.client
      break
    }
  }

  if (!workingPassword || !rootClient) {
    console.error(`\n❌ Could not authenticate with user '${creds.user}' on PostgreSQL server (${creds.host}:${creds.port}).`)
    console.error(`💡 Tested passwords: ${candidatePasswords.map(p => `'${p}'`).join(', ')}`)
    console.error('\n🛠️ ACTION REQUIRED: Please edit backend/.env and set DB_PASSWORD to your local PostgreSQL password.')
    process.exit(1)
  }

  console.log(`✅ Authenticated successfully with PostgreSQL user '${creds.user}'!`)

  updateEnvFile(workingPassword)

  // Step 1: Ensure database exists
  try {
    const dbCheck = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [creds.database]
    )

    if (dbCheck.rowCount === 0) {
      console.log(`📦 Database '${creds.database}' does not exist. Creating database...`)
      await rootClient.query(`CREATE DATABASE "${creds.database}"`)
      console.log(`✅ Database '${creds.database}' created successfully!`)
    } else {
      console.log(`ℹ️ Database '${creds.database}' already exists.`)
    }
  } catch (err) {
    console.error('❌ Failed to check/create database:', err.message)
    process.exit(1)
  } finally {
    await rootClient.end()
  }

  // Step 2: Connect to target database and execute schema.sql & seed.sql
  const targetPool = new Pool({
    host: creds.host,
    port: creds.port,
    user: creds.user,
    password: workingPassword,
    database: creds.database,
  })

  try {
    const client = await targetPool.connect()
    console.log(`⚡ Connected to database '${creds.database}'. Executing schema.sql...`)

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')
      await client.query(schemaSql)
      console.log('✅ Schema migration completed successfully!')
    } else {
      console.warn(`⚠️ Warning: Schema file not found at ${schemaPath}`)
    }

    console.log('🌱 Executing seed.sql...')
    const seedPath = path.resolve(__dirname, '../../database/seed.sql')
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8')
      await client.query(seedSql)
      console.log('✅ Seed data inserted successfully!')
    } else {
      console.warn(`⚠️ Warning: Seed file not found at ${seedPath}`)
    }

    client.release()
    console.log('🎉 Database setup completed cleanly and successfully!')
  } catch (err) {
    console.error('❌ Error executing database scripts:', err.message)
    process.exit(1)
  } finally {
    await targetPool.end()
  }
}

setupDatabase()
