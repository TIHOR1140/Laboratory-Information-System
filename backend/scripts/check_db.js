const pool = require('../src/config/db')
require('dotenv').config()

async function checkDatabase() {
  console.log('🔍 Checking Database Connection & Schema Health...')
  try {
    const client = await pool.connect()
    
    // Check connection & current database name
    const dbInfo = await client.query('SELECT current_database(), current_user, version()')
    const currentDb = dbInfo.rows[0].current_database
    const currentUser = dbInfo.rows[0].current_user
    console.log(`✅ Connected as user '${currentUser}' to database '${currentDb}'`)

    // Query tables list
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    const tables = tablesRes.rows.map(r => r.table_name)
    console.log(`\n📊 Found ${tables.length} tables in public schema:`)
    tables.forEach(t => console.log(`   • ${t}`))

    // Check row counts for main LIS tables
    console.log('\n📈 Table Record Counts:')
    const expectedTables = ['users', 'user_profiles', 'patients', 'appointments', 'tests', 'samples', 'test_results', 'reports', 'invoices', 'user_sessions']
    for (const table of expectedTables) {
      if (tables.includes(table)) {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`)
        console.log(`   ✔ ${table.padEnd(20)}: ${countRes.rows[0].count} records`)
      } else {
        console.log(`   ❌ ${table.padEnd(20)}: MISSING TABLE`)
      }
    }

    client.release()
    console.log('\n✅ Database health check finished successfully!')
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    console.error('💡 Tip: Ensure PostgreSQL is running and DB credentials in .env are correct.')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkDatabase()
