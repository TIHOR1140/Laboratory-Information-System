require('dotenv').config()
const pool = require('./src/config/db')

async function run() {
  console.log('Starting LIS Database Schema Upgrade...')
  const client = await pool.connect()
  try {
    console.log('Checking and adding columns to the users table...')
    
    // Add two_factor_enabled
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `)
    console.log('✔ Column "two_factor_enabled" verified/added.')

    // Add two_factor_secret
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT
    `)
    console.log('✔ Column "two_factor_secret" verified/added.')

    // Add two_factor_method
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(50) DEFAULT 'TOTP'
    `)
    console.log('✔ Column "two_factor_method" verified/added.')

    // Add email_otp_code
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_otp_code VARCHAR(6) DEFAULT NULL
    `)
    console.log('✔ Column "email_otp_code" verified/added.')

    // Add email_otp_expires_at
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMPTZ DEFAULT NULL
    `)
    console.log('✔ Column "email_otp_expires_at" verified/added.')

    console.log('Database Schema Upgrade completed successfully!')
  } catch (err) {
    console.error('❌ Database migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
