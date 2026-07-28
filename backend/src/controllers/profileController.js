const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')
const { hashPassword, comparePassword } = require('../utils/password')
const { publicUser, publicProfile } = require('../utils/user')

async function getProfile(req, res) {
  const userResult = await pool.query(
    'SELECT id, name, email, role, is_active, last_login, two_factor_enabled, two_factor_method, created_at, updated_at FROM users WHERE id = $1',
    [req.auth.sub],
  )
  const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.auth.sub])

  if (userResult.rowCount === 0) {
    throw new HttpError(404, 'Profile not found.')
  }

  return res.status(200).json({
    user: publicUser(userResult.rows[0]),
    patient: publicProfile(profileResult.rows[0]),
    profile: publicProfile(profileResult.rows[0]),
  })
}

async function updateProfile(req, res) {
  const {
    firstName,
    lastName,
    phone,
    emergencyContactNumber,
    streetAddress,
    city,
    district,
    bloodGroup,
    allergies,
    medicalNotes,
  } = req.body

  const nameFromFields = [firstName, lastName].filter(Boolean).join(' ').trim()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const userResult = await client.query(
      `
        UPDATE users
        SET name = COALESCE($1, name),
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, role, is_active, last_login, two_factor_enabled, two_factor_method, created_at, updated_at
      `,
      [nameFromFields || null, req.auth.sub],
    )

    const hasProfile = await client.query('SELECT id FROM user_profiles WHERE user_id = $1', [req.auth.sub])
    if (hasProfile.rowCount > 0) {
      await client.query(
        `
          UPDATE user_profiles
          SET phone = COALESCE($1, phone),
              emergency_contact = COALESCE($2, emergency_contact),
              street_address = COALESCE($3, street_address),
              city = COALESCE($4, city),
              district = COALESCE($5, district),
              blood_group = COALESCE(NULLIF($6, ''), blood_group),
              allergies = COALESCE(NULLIF($7, ''), allergies),
              medical_notes = COALESCE(NULLIF($8, ''), medical_notes),
              updated_at = NOW()
          WHERE user_id = $9
        `,
        [
          phone?.trim() || null,
          emergencyContactNumber?.trim() || null,
          streetAddress?.trim() || null,
          city?.trim() || null,
          district?.trim() || null,
          bloodGroup?.trim() || '',
          allergies?.trim() || '',
          medicalNotes?.trim() || '',
          req.auth.sub,
        ],
      )
    } else {
      await client.query(
        `
          INSERT INTO user_profiles (
            user_id,
            phone,
            emergency_contact,
            street_address,
            city,
            district,
            blood_group,
            allergies,
            medical_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, ''))
        `,
        [
          req.auth.sub,
          phone?.trim() || null,
          emergencyContactNumber?.trim() || null,
          streetAddress?.trim() || null,
          city?.trim() || null,
          district?.trim() || null,
          bloodGroup?.trim() || '',
          allergies?.trim() || '',
          medicalNotes?.trim() || '',
        ],
      )
    }

    await logAudit(req.auth.sub, 'Profile Update', 'User profile information was updated.')
    await client.query('COMMIT')

    const updatedProfile = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.auth.sub])

    return res.status(200).json({
      user: publicUser(userResult.rows[0]),
      patient: publicProfile(updatedProfile.rows[0]),
      profile: publicProfile(updatedProfile.rows[0]),
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body

  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.auth.sub])
  const user = result.rows[0]

  if (!user) {
    throw new HttpError(404, 'Profile not found.')
  }

  const valid = await comparePassword(currentPassword, user.password_hash)
  if (!valid) {
    throw new HttpError(400, 'Current password is incorrect.')
  }

  const nextHash = await hashPassword(newPassword)
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [nextHash, req.auth.sub])

  // Revoke all other active sessions for this user on password change
  await pool.query(
    'UPDATE user_sessions SET is_revoked = TRUE, updated_at = NOW() WHERE user_id = $1 AND jti <> $2',
    [req.auth.sub, req.auth.jti || '']
  )

  await logAudit(req.auth.sub, 'Password Change', 'User changed their password and invalidated other sessions.')

  return res.status(200).json({ message: 'Password updated successfully. Other active sessions have been signed out.' })
}

async function getActiveSessions(req, res) {
  const userId = req.auth.sub
  const result = await pool.query(
    `SELECT jti, ip_address, user_agent, created_at, updated_at 
     FROM user_sessions 
     WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  )

  return res.status(200).json({
    sessions: result.rows.map((row) => ({
      jti: row.jti,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isCurrent: row.jti === req.auth.jti,
    })),
  })
}

async function revokeSession(req, res) {
  const userId = req.auth.sub
  const { jti } = req.body
  if (!jti) throw new HttpError(400, 'Missing session ID')

  // Check if session belongs to the current user
  const check = await pool.query('SELECT user_id FROM user_sessions WHERE jti = $1', [jti])
  const session = check.rows[0]
  if (!session) throw new HttpError(404, 'Session not found')
  if (session.user_id !== userId) {
    throw new HttpError(403, 'You do not have permission to revoke this session')
  }

  await pool.query('UPDATE user_sessions SET is_revoked = TRUE, updated_at = NOW() WHERE jti = $1', [jti])
  await logAudit(userId, 'Session Revoked', `User revoked session ID ${jti}`)

  return res.status(200).json({ message: 'Session revoked successfully.' })
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getActiveSessions,
  revokeSession,
}