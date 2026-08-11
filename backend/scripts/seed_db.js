const fs = require('fs')
const path = require('path')
const pool = require('../src/config/db')
require('dotenv').config()

async function seedDatabase() {
  console.log('🌱 Executing seed.sql on database...')
  try {
    const client = await pool.connect()
    const seedPath = path.resolve(__dirname, '../../database/seed.sql')

    if (!fs.existsSync(seedPath)) {
      console.error(`❌ seed.sql not found at ${seedPath}`)
      process.exit(1)
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8')
    await client.query(seedSql)
    console.log('✅ Seed data inserted successfully!')

    client.release()
  } catch (err) {
    console.error('❌ Error executing seed.sql:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedDatabase()
