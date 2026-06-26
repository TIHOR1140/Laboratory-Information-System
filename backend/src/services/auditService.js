const pool = require('../config/db')

async function logAudit(userId, action, description, client = {}) {
  await pool.query(
    `
      INSERT INTO audit_logs (user_id, action, description)
      VALUES ($1, $2, $3)
    `,
    [userId || null, action, description],
  )
}

module.exports = {
  logAudit,
}
