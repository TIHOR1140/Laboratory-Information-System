const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')
const { hashPassword, comparePassword } = require('../utils/password')
const { publicUser, publicProfile } = require('../utils/user')

async function getProfile(req, res) {
  const userResult = await pool.query(
    'SELECT id, name, email, role, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
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
        RETURNING id, name, email, role, is_active, last_login, created_at, updated_at
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

  await logAudit(req.auth.sub, 'Password Change', 'User changed their password.')

  return res.status(200).json({ message: 'Password updated successfully.' })
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
}