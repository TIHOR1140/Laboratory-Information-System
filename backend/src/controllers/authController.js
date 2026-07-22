const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { hashPassword, comparePassword } = require('../utils/password')
const { signToken } = require('../utils/jwt')
const { signTempToken, verifyToken } = require('../utils/jwt')
const { logAudit } = require('../services/auditService')
const { normalizeEmail } = require('../utils/validation')
const { fullName, publicUser, publicProfile, splitName } = require('../utils/user')
const { generateSecret, generateQRCodeDataURL, verifyTOTP } = require('../utils/twoFactor')

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

  // If user has 2FA enabled, return a short-lived temp token and indicate 2FA required
  if (user.two_factor_enabled) {
    const tempToken = signTempToken(user)
    await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
    await logAudit(user.id, 'Login', `User ${fullName(user)} passed password check; 2FA required.`)

    return res.status(200).json({
      twoFactorRequired: true,
      tempToken,
      user: publicUser(user),
    })
  }

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
  await logAudit(user.id, 'Login', `User ${fullName(user)} signed in.`)

  return res.status(200).json({
    token: signToken(user),
    user: publicUser(user),
  })
}

// Protected route: generate a new secret for the authenticated user to set up 2FA
async function setupTwoFactor(req, res) {
  const userId = req.auth.sub
  const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user) throw new HttpError(404, 'User not found')

  const secret = await generateSecret({ name: user.name, email: user.email })
  const qr = await generateQRCodeDataURL(secret.otpauth_url)

  return res.status(200).json({ secret: secret.base32, otpauth_url: secret.otpauth_url, qr })
}

// Protected route: enable 2FA after verifying a code from the authenticator app
async function enableTwoFactor(req, res) {
  const userId = req.auth.sub
  const { secret, token } = req.body
  if (!secret || !token) throw new HttpError(400, 'Missing secret or token')

  const ok = verifyTOTP(secret, token)
  if (!ok) throw new HttpError(400, 'Invalid two-factor token')

  await pool.query('UPDATE users SET two_factor_enabled = TRUE, two_factor_secret = $1 WHERE id = $2', [secret, userId])
  await logAudit(userId, '2FA Enabled', 'User enabled two-factor authentication.')

  return res.status(200).json({ message: 'Two-factor authentication enabled.' })
}

// Public route: finalize login by verifying temp token and TOTP code
async function verifyTwoFactorLogin(req, res) {
  const { tempToken, token } = req.body
  if (!tempToken || !token) throw new HttpError(400, 'Missing tempToken or token')

  let payload
  try {
    payload = verifyToken(tempToken)
  } catch (err) {
    throw new HttpError(401, 'Invalid or expired temporary token')
  }

  if (!payload.twoFactor || !payload.sub) {
    throw new HttpError(401, 'Invalid temporary token payload')
  }

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub])
  const user = result.rows[0]
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    throw new HttpError(401, 'Two-factor not configured for this account')
  }

  const ok = verifyTOTP(user.two_factor_secret, token)
  if (!ok) throw new HttpError(401, 'Invalid two-factor token')

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
  await logAudit(user.id, 'Login', `User ${fullName(user)} completed 2FA and signed in.`)

  return res.status(200).json({ token: signToken(user), user: publicUser(user) })
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
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactorLogin,
}