const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { hashPassword, comparePassword } = require('../utils/password')
const { signToken } = require('../utils/jwt')
const { signTempToken, verifyToken } = require('../utils/jwt')
const { logAudit } = require('../services/auditService')
const { normalizeEmail } = require('../utils/validation')
const { fullName, publicUser, publicProfile, splitName } = require('../utils/user')
const { generateSecret, generateQRCodeDataURL, verifyTOTP } = require('../utils/twoFactor')
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService')

const crypto = require('crypto')

async function createUserSession(userId, req) {
  const jti = crypto.randomUUID()
  const userAgent = req.headers['user-agent'] || 'Unknown'
  const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1'
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h

  // Enforce session limit (max 3 active)
  try {
    const activeCountResult = await pool.query(
      'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW()',
      [userId]
    )
    const activeCount = parseInt(activeCountResult.rows[0].count, 10)

    if (activeCount >= 3) {
      const oldestResult = await pool.query(
        `
          SELECT jti FROM user_sessions 
          WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW() 
          ORDER BY created_at ASC 
          LIMIT 1
        `,
        [userId]
      )
      if (oldestResult.rowCount > 0) {
        const oldestJti = oldestResult.rows[0].jti
        await pool.query(
          'UPDATE user_sessions SET is_revoked = TRUE, updated_at = NOW() WHERE jti = $1',
          [oldestJti]
        )
        await logAudit(userId, 'Security Alert', `Max sessions exceeded. Auto-revoked oldest session: ${oldestJti}`)
      }
    }
  } catch (err) {
    console.error('Session count check failed:', err.message)
  }

  // Insert session
  await pool.query(
    `
      INSERT INTO user_sessions (jti, user_id, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [jti, userId, ipAddress, userAgent, expiresAt]
  )

  return jti
}

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

  const registrationId = crypto.randomUUID()
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
  const passwordHash = await hashPassword(password)

  await pool.query(
    `
      INSERT INTO pending_registrations
        (id, name, date_of_birth, gender, email, phone, password_hash, otp_hash, attempts, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        name = EXCLUDED.name,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        otp_hash = EXCLUDED.otp_hash,
        attempts = 0,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW()
    `,
    [registrationId, patientFullName, dateOfBirth, gender, normalizedEmail, phone.trim(), passwordHash, otpHash]
  )

  try {
    await sendOTPEmail(normalizedEmail, otp, patientFullName)
  } catch (error) {
    await pool.query('DELETE FROM pending_registrations WHERE id = $1', [registrationId])
    throw new HttpError(502, 'We could not send the verification email. Please check the email address and try again.')
  }

  return res.status(200).json({
    verificationRequired: true,
    registrationId,
    message: 'A verification code was sent to your email address.',
  })
}

async function verifyRegistration(req, res) {
  const { registrationId, otp } = req.body
  if (!/^\d{6}$/.test(String(otp))) {
    throw new HttpError(400, 'Verification code must contain exactly 6 digits.')
  }

  const client = await pool.connect()
  let transactionOpen = false

  try {
    await client.query('BEGIN')
    transactionOpen = true

    const pendingResult = await client.query(
      'SELECT * FROM pending_registrations WHERE id = $1 FOR UPDATE',
      [registrationId]
    )
    const pending = pendingResult.rows[0]

    if (!pending) {
      throw new HttpError(400, 'Registration expired or unavailable. Please submit the registration form again.')
    }

    if (new Date() > new Date(pending.expires_at)) {
      await client.query('DELETE FROM pending_registrations WHERE id = $1', [registrationId])
      await client.query('COMMIT')
      transactionOpen = false
      throw new HttpError(400, 'The verification code has expired. Please submit the registration form again.')
    }

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex')
    if (otpHash !== pending.otp_hash) {
      const attemptResult = await client.query(
        'UPDATE pending_registrations SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts',
        [registrationId]
      )
      const attempts = attemptResult.rows[0].attempts

      if (attempts >= 3) {
        await client.query('DELETE FROM pending_registrations WHERE id = $1', [registrationId])
        await client.query('COMMIT')
        transactionOpen = false
        throw new HttpError(400, 'Incorrect verification code. You have used all 3 attempts. No account was created.')
      }

      await client.query('COMMIT')
      transactionOpen = false
      throw new HttpError(400, `Incorrect verification code. ${3 - attempts} attempt(s) remaining.`)
    }

    const userResult = await client.query(
      `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, 'PATIENT')
        RETURNING id, name, email, role, is_active, last_login, created_at, updated_at
      `,
      [pending.name, pending.email, pending.password_hash]
    )
    const user = userResult.rows[0]

    const profileResult = await client.query(
      `
        INSERT INTO user_profiles (user_id, phone, date_of_birth, gender)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [user.id, pending.phone, pending.date_of_birth, pending.gender]
    )

    const countResult = await client.query('SELECT COUNT(*) FROM patients')
    const patientCode = `PAT-2026-${String(parseInt(countResult.rows[0].count || 0, 10) + 1).padStart(4, '0')}`
    const nameParts = pending.name.split(' ')
    const firstName = nameParts[0] || pending.name
    const lastName = nameParts.slice(1).join(' ') || 'Patient'

    await client.query(
      `
        INSERT INTO patients (user_id, patient_code, first_name, last_name, email, phone, date_of_birth, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [user.id, patientCode, firstName, lastName, pending.email, pending.phone, pending.date_of_birth, pending.gender]
    )

    await client.query('DELETE FROM pending_registrations WHERE id = $1', [registrationId])
    await client.query('COMMIT')
    transactionOpen = false

    const jti = await createUserSession(user.id, req)
    await logAudit(user.id, 'Registration', `Patient registration created for ${pending.name}.`)

    return res.status(201).json({
      token: signToken(user, jti),
      user: publicUser(user),
      patient: publicProfile(profileResult.rows[0]),
      message: 'Email verified successfully. Your account was created.',
    })
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK')
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

  // If user has 2FA enabled, return requirement mapping and trigger email OTP if selected
  if (user.two_factor_enabled) {
    const mfaMethod = user.two_factor_method || 'TOTP'
    
    if (mfaMethod === 'EMAIL') {
      // Generate a 6-digit verification code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      await pool.query(
        `
          UPDATE users 
          SET email_otp_code = $1, email_otp_expires_at = NOW() + INTERVAL '10 minutes' 
          WHERE id = $2
        `,
        [otpCode, user.id]
      )
      
      // Send email asynchronously so user doesn't wait
      sendOTPEmail(user.email, otpCode, user.name).catch((err) => {
        console.error('Failed to send login 2FA OTP email:', err.message)
      })
    }

    await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
    await logAudit(user.id, 'Login', `User ${fullName(user)} passed password check; 2FA (${mfaMethod}) required.`)

    return res.status(200).json({
      require2FA: true,
      userId: user.id,
      method: mfaMethod,
    })
  }

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
  
  // Create session and get jti
  const jti = await createUserSession(user.id, req)

  await logAudit(user.id, 'Login', `User ${fullName(user)} signed in.`)

  return res.status(200).json({
    token: signToken(user, jti),
    user: publicUser(user),
  })
}

// Protected route: generate a new secret for the authenticated user to set up 2FA
async function setupTwoFactor(req, res) {
  const userId = req.auth.sub
  const { method } = req.body
  const targetMethod = String(method || 'TOTP').toUpperCase()

  const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user) throw new HttpError(404, 'User not found')

  const secret = await generateSecret({ name: user.name, email: user.email })
  const qr = await generateQRCodeDataURL(secret.otpauth_url)

  if (targetMethod === 'EMAIL') {
    // Generate setup confirmation passcode
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    await pool.query(
      `
        UPDATE users 
        SET two_factor_secret = $1, email_otp_code = $2, email_otp_expires_at = NOW() + INTERVAL '10 minutes' 
        WHERE id = $3
      `,
      [secret.base32, otpCode, userId]
    )

    // Send verification email asynchronously so user doesn't wait
    sendOTPEmail(user.email, otpCode, user.name).catch((err) => {
      console.error('Failed to send setup 2FA OTP email:', err.message)
    })
  }

  return res.status(200).json({
    secret: secret.base32,
    qrCodeDataUrl: qr,
  })
}

// Protected route: enable 2FA after verifying a code from the authenticator app / email setup
async function enableTwoFactor(req, res) {
  const userId = req.auth.sub
  const { secret: bodySecret, token: bodyToken, code, method } = req.body
  const token = bodyToken || code
  const targetMethod = String(method || 'TOTP').toUpperCase()

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user) throw new HttpError(404, 'User not found')

  const secret = bodySecret || user.two_factor_secret
  if (!secret || !token) throw new HttpError(400, 'Missing secret or token')

  if (targetMethod === 'EMAIL') {
    if (!user.email_otp_code || !user.email_otp_expires_at || new Date(user.email_otp_expires_at) < new Date()) {
      throw new HttpError(400, 'Verification code has expired or is invalid.')
    }
    if (user.email_otp_code !== token) {
      throw new HttpError(400, 'Invalid verification code.')
    }
    // Clear code and enable 2FA
    await pool.query(
      `
        UPDATE users 
        SET two_factor_enabled = TRUE, two_factor_secret = $1, two_factor_method = 'EMAIL', email_otp_code = NULL, email_otp_expires_at = NULL 
        WHERE id = $2
      `,
      [secret, userId]
    )
  } else {
    // TOTP (Authenticator App)
    const ok = verifyTOTP(secret, token)
    if (!ok) throw new HttpError(400, 'Invalid two-factor token')
    await pool.query(
      `
        UPDATE users 
        SET two_factor_enabled = TRUE, two_factor_secret = $1, two_factor_method = 'TOTP' 
        WHERE id = $2
      `,
      [secret, userId]
    )
  }

  await logAudit(userId, '2FA Enabled', `User enabled two-factor authentication via ${targetMethod}.`)

  return res.status(200).json({ message: 'Two-factor authentication enabled.' })
}

// Protected route: request a verification code to disable 2FA (for Email OTP)
async function requestDisableTwoFactor(req, res) {
  const userId = req.auth.sub

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user || !user.two_factor_enabled) {
    throw new HttpError(400, '2FA is not currently enabled for this account')
  }

  if (user.two_factor_method !== 'EMAIL') {
    throw new HttpError(400, 'Email verification is not required for this 2FA method')
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  await pool.query(
    `
      UPDATE users 
      SET email_otp_code = $1, email_otp_expires_at = NOW() + INTERVAL '10 minutes' 
      WHERE id = $2
    `,
    [otpCode, userId]
  )

  // Send verification email asynchronously so user doesn't wait
  sendOTPEmail(user.email, otpCode, user.name).catch((err) => {
    console.error('Failed to send disable 2FA OTP email:', err.message)
  })

  return res.status(200).json({ message: 'A verification code has been sent to your email.' })
}

// Protected route: disable 2FA
async function disableTwoFactor(req, res) {
  const userId = req.auth.sub
  const { code } = req.body
  if (!code) throw new HttpError(400, 'Missing two-factor verification code')

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user || !user.two_factor_enabled) {
    throw new HttpError(400, '2FA is not currently enabled for this account')
  }

  if (user.two_factor_method === 'EMAIL') {
    if (!user.email_otp_code || !user.email_otp_expires_at || new Date(user.email_otp_expires_at) < new Date()) {
      throw new HttpError(400, 'Verification code has expired or is invalid.')
    }
    if (user.email_otp_code !== code) {
      throw new HttpError(400, 'Invalid verification code.')
    }
  } else {
    // TOTP
    if (!user.two_factor_secret) {
      throw new HttpError(400, '2FA is not currently enabled for this account')
    }
    const ok = verifyTOTP(user.two_factor_secret, code)
    if (!ok) throw new HttpError(400, 'Invalid two-factor code')
  }

  await pool.query(
    `
      UPDATE users 
      SET two_factor_enabled = FALSE, 
          two_factor_secret = NULL, 
          two_factor_method = 'TOTP', 
          email_otp_code = NULL, 
          email_otp_expires_at = NULL 
      WHERE id = $1
    `,
    [userId]
  )
  await logAudit(userId, '2FA Disabled', 'User disabled two-factor authentication.')

  return res.status(200).json({ message: 'Two-factor authentication disabled.' })
}

// Public route: finalize login by verifying TOTP code / Email code from frontend
async function verifyTwoFactorLogin(req, res) {
  const { userId, code } = req.body
  if (!userId || !code) throw new HttpError(400, 'Missing userId or code')

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user || !user.two_factor_enabled) {
    throw new HttpError(401, 'Two-factor not configured for this account')
  }

  if (user.two_factor_method === 'EMAIL') {
    if (!user.email_otp_code || !user.email_otp_expires_at || new Date(user.email_otp_expires_at) < new Date()) {
      throw new HttpError(401, 'Verification code has expired or is invalid.')
    }
    if (user.email_otp_code !== code) {
      throw new HttpError(401, 'Invalid verification code.')
    }
    // Clear code after successful verification
    await pool.query('UPDATE users SET email_otp_code = NULL, email_otp_expires_at = NULL WHERE id = $1', [user.id])
  } else {
    // TOTP
    if (!user.two_factor_secret) {
      throw new HttpError(401, 'Two-factor not configured for this account')
    }
    const ok = verifyTOTP(user.two_factor_secret, code)
    if (!ok) throw new HttpError(401, 'Invalid two-factor token')
  }

  await pool.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [user.id])
  
  // Create session and get jti
  const jti = await createUserSession(user.id, req)

  await logAudit(user.id, 'Login', `User ${fullName(user)} completed 2FA and signed in.`)

  return res.status(200).json({
    token: signToken(user, jti),
    user: publicUser(user),
  })
}

// Public route: resend 2FA Email OTP code
async function resendTwoFactor(req, res) {
  const { userId } = req.body
  if (!userId) throw new HttpError(400, 'Missing user ID')

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result.rows[0]
  if (!user || !user.two_factor_enabled || user.two_factor_method !== 'EMAIL') {
    throw new HttpError(400, 'Email 2FA is not configured for this account')
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  await pool.query(
    `
      UPDATE users 
      SET email_otp_code = $1, email_otp_expires_at = NOW() + INTERVAL '10 minutes' 
      WHERE id = $2
    `,
    [otpCode, user.id]
  )

  // Send verification email asynchronously so user doesn't wait
  sendOTPEmail(user.email, otpCode, user.name).catch((err) => {
    console.error('Failed to resend 2FA OTP email:', err.message)
  })
  await logAudit(user.id, '2FA Code Resent', 'Verification code resent via email.')

  return res.status(200).json({ message: 'Verification code resent successfully.' })
}

async function logout(req, res) {
  if (req.auth?.sub) {
    // Invalidate session jti
    if (req.auth.jti) {
      await pool.query(
        'UPDATE user_sessions SET is_revoked = TRUE, updated_at = NOW() WHERE jti = $1',
        [req.auth.jti]
      )
    }
    await logAudit(req.auth.sub, 'Logout', 'User signed out of the application.')
  }

  return res.status(200).json({
    message: 'Logged out successfully.',
  })
}

async function forgotPassword(req, res) {
  const { email } = req.body
  const normalizedEmail = normalizeEmail(email)

  const result = await pool.query('SELECT id, name FROM users WHERE email = $1 AND is_active = TRUE', [normalizedEmail])
  if (result.rowCount === 0) {
    // Return 200 to prevent email enumeration attacks
    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' })
  }

  const user = result.rows[0]
  
  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString('hex')
  // Hash token for database storage
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 mins

  await pool.query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
    [hashedToken, expiresAt, user.id]
  )

  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`
  await sendPasswordResetEmail(normalizedEmail, resetLink, user.name)
  await logAudit(user.id, 'Password Reset Requested', 'User requested a password reset link.')

  return res.status(200).json({
    message: 'If an account with that email exists, a reset link has been sent.',
  })
}

async function resetPassword(req, res) {
  const { token, password } = req.body

  if (!token) throw new HttpError(400, 'Invalid or missing reset token.')

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const result = await pool.query(
    'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW() AND is_active = TRUE',
    [hashedToken]
  )

  if (result.rowCount === 0) {
    throw new HttpError(400, 'Token is invalid or has expired.')
  }

  const user = result.rows[0]
  const passwordHash = await hashPassword(password)

  await pool.query(
    `UPDATE users 
     SET password_hash = $1, 
         reset_password_token = NULL, 
         reset_password_expires = NULL, 
         updated_at = NOW() 
     WHERE id = $2`,
    [passwordHash, user.id]
  )

  // Invalidate all active sessions for security
  await pool.query('UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE', [user.id])
  await logAudit(user.id, 'Password Reset Complete', 'User successfully reset their password and all sessions were revoked.')

  return res.status(200).json({
    message: 'Password has been successfully reset. Please log in with your new password.',
  })
}

module.exports = {
  registerPatient,
  verifyRegistration,
  login,
  logout,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  requestDisableTwoFactor,
  verifyTwoFactorLogin,
  resendTwoFactor,
  forgotPassword,
  resetPassword,
}