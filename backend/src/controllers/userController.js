const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { hashPassword } = require('../utils/password')
const { logAudit } = require('../services/auditService')
const { fullName, publicUser, splitName } = require('../utils/user')

const staffRoles = new Set(['RECEPTIONIST', 'TECHNICIAN'])

async function listUsers(req, res) {
  const result = await pool.query(
    `
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login, u.created_at, u.updated_at, p.phone
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
    `,
  )

  return res.status(200).json({
    users: result.rows.map(publicUser),
  })
}

async function createUser(req, res) {
  const { firstName, lastName, email, phone, password, role } = req.body
  
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()

  const callerRole = req.auth.role
  const targetRole = String(role || '').trim().toUpperCase()

  const allowedRolesForCaller = callerRole === 'ADMIN'
    ? ['ADMIN', 'RECEPTIONIST', 'TECHNICIAN', 'PATIENT']
    : ['PATIENT']

  if (!allowedRolesForCaller.includes(targetRole)) {
    throw new HttpError(403, `You are not allowed to create users with the role ${targetRole}.`)
  }

  // Manual email normalization (since normalizeEmail may not exist)
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'An account with this email already exists.')
  }

  const passwordHash = await hashPassword(password)

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, name, email, role, is_active, last_login, created_at, updated_at
    `,
    [name, normalizedEmail, passwordHash, role],
  )

  const newUser = result.rows[0]

  if (phone?.trim()) {
    await pool.query(
      `INSERT INTO user_profiles (user_id, phone) VALUES ($1, $2)`,
      [newUser.id, phone.trim()]
    )
  }

  // Safe audit log
  try {
    await logAudit(req.auth?.sub || req.auth?.userId, 'User Creation', `Created ${role} account for ${name || email}.`)
  } catch (auditErr) {
    console.warn('⚠️ Audit log failed (non-critical):', auditErr.message)
  }

  return res.status(201).json({
    user: publicUser(newUser),
  })
}

async function updateStatus(req, res) {
  const { id } = req.params
  const { isActive } = req.body

  const result = await pool.query(
    `
      UPDATE users
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, role, is_active, last_login, created_at, updated_at
    `,
    [Boolean(isActive), id],
  )

  if (result.rowCount === 0) {
    throw new HttpError(404, 'User not found.')
  }

  await logAudit(
    req.auth.sub,
    'User Deactivation',
    `${result.rows[0].is_active ? 'Activated' : 'Deactivated'} user ${fullName(result.rows[0])}.`,
  )

  return res.status(200).json({
    user: publicUser(result.rows[0]),
  })
}

async function listAuditLogs(req, res) {
  const result = await pool.query(`
    SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 200
  `)
  return res.status(200).json({ logs: result.rows })
}

module.exports = {
  listUsers,
  createUser,
  updateStatus,
  listAuditLogs,
}