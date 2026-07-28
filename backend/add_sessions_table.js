require('dotenv').config()
const pool = require('./src/config/db')

async function run() {
  console.log('Starting LIS Database Schema Upgrade: Session Registry...')
  const client = await pool.connect()
  try {
    console.log('Creating user_sessions table...')
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        jti VARCHAR(255) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log('✔ Table "user_sessions" verified/created.')

    // Add index on user_id for fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)
    `)
    console.log('✔ Index on user_sessions(user_id) verified/created.')

    console.log('Session Registry Database migration completed successfully!')
  } catch (err) {
    console.error('❌ Database migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
