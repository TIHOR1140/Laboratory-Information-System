const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { hashPassword, comparePassword } = require('../utils/password')
const { signToken } = require('../utils/jwt')
const { logAudit } = require('../services/auditService')
const { normalizeEmail } = require('../utils/validation')
const { fullName, publicUser, publicProfile, splitName } = require('../utils/user')

async function registerPatient(req, res) {
  const {
    name,
    dateOfBirth,
    gender,
    email,
    phone,
    password,
  } = req.body

  const patientFullName = String(name || '').trim()
  const normalizedEmail = normalizeEmail(email)

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])

  if (existing.rowCount > 0) {
    throw new HttpError(409, 'An account with this email already exists.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const passwordHash = await hashPassword(password)
    const userResult = await client.query(
      `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, 'PATIENT')
        RETURNING id, name, email, role, is_active, last_login, created_at, updated_at
      `,
      [patientFullName, normalizedEmail, passwordHash],
    )

    const user = userResult.rows[0]

    const profileResult = await client.query(
      `
        INSERT INTO user_profiles (user_id, phone, date_of_birth, gender)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [user.id, phone.trim(), dateOfBirth, gender]
    )

    // FIXED: Commit first, then log audit
    await client.query('COMMIT')

    // Log audit AFTER commit
    await logAudit(user.id, 'Registration', `Patient registration created for ${patientFullName}.`)

    return res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
      patient: publicProfile(profileResult.rows[0]),
    })

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function login(req, res) {
  const { email, password } = req.body
  const normalizedEmail = normalizeEmail(email)

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail])
  const user = result.rows[0]

  if (!user || !user.is_active) {
    throw new HttpError(401, 'Invalid credentials or inactive account.')
  }

  const valid = await comparePassword(password, user.password_hash)
  if (!valid) {
    throw new HttpError(401, 'Invalid credentials or inactive account.')
  }

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
  await logAudit(user.id, 'Login', `User ${fullName(user)} signed in.`)

  return res.status(200).json({
    token: signToken(user),
    user: publicUser(user),
  })
}

async function logout(req, res) {
  if (req.auth?.sub) {
    await logAudit(req.auth.sub, 'Logout', 'User signed out of the application.')
  }

  return res.status(200).json({
    message: 'Logged out successfully.',
  })
}

module.exports = {
  registerPatient,
  login,
  logout,
}