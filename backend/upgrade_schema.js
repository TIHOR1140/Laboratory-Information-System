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

    // Add reset_password_token
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) DEFAULT NULL
    `)
    console.log('✔ Column "reset_password_token" verified/added.')

    // Add reset_password_expires
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMPTZ DEFAULT NULL
    `)
    console.log('✔ Column "reset_password_expires" verified/added.')

    // Add patient_code to patients table
    await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS patient_code VARCHAR(50) UNIQUE
    `)
    console.log('✔ Column "patient_code" verified/added to patients table.')

    // Backfill patient_code for existing patients without one
    const unassignedPatients = await client.query(`SELECT id FROM patients WHERE patient_code IS NULL ORDER BY created_at ASC`)
    let counter = 1
    for (const p of unassignedPatients.rows) {
      const code = `PAT-2026-${String(counter).padStart(4, '0')}`
      await client.query(`UPDATE patients SET patient_code = $1 WHERE id = $2`, [code, p.id])
      counter++
    }
    if (unassignedPatients.rows.length > 0) {
      console.log(`✔ Generated unique patient_codes for ${unassignedPatients.rows.length} existing patient(s).`)
    }

    // Create test_parameters table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_parameters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        reference_range VARCHAR(255) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✔ Table "test_parameters" verified/created.')

    // Update tests table columns
    await client.query(`
      ALTER TABLE tests ADD COLUMN IF NOT EXISTS reference_range TEXT DEFAULT '';
      ALTER TABLE tests ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT '';
    `)
    console.log('✔ Table "tests" columns updated.')

    // Update samples table
    await client.query(`
      ALTER TABLE samples ADD COLUMN IF NOT EXISTS sample_type VARCHAR(100) DEFAULT 'Blood';
      ALTER TABLE samples ALTER COLUMN barcode DROP NOT NULL;
    `)
    console.log('✔ Table "samples" updated.')

    // Update test_results table
    await client.query(`
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS sample_id UUID REFERENCES samples(id) ON DELETE CASCADE;
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS parameter_id UUID REFERENCES test_parameters(id) ON DELETE CASCADE;
      ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_appointment_id_test_id_key;
      ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_appointment_id_test_id_parameter_id_key;
      ALTER TABLE test_results ADD CONSTRAINT test_results_appointment_id_test_id_parameter_id_key UNIQUE (appointment_id, test_id, parameter_id);
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(100) DEFAULT 'Semi-Automatic Analyzer';
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
      ALTER TABLE test_results ADD COLUMN IF NOT EXISTS reference_range VARCHAR(255);
    `)
    console.log('✔ Table "test_results" updated.')

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
