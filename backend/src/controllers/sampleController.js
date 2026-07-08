const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function listSamples(req, res) {
  const result = await pool.query(`
    SELECT s.*, a.appointment_date, a.reason, u.name as patient_name
    FROM samples s
    JOIN appointments a ON s.appointment_id = a.id
    JOIN users u ON a.patient_id = u.id
    ORDER BY s.created_at DESC
  `)
  res.status(200).json({ samples: result.rows })
}

async function updateSample(req, res) {
  const { id } = req.params
  const { status, barcode } = req.body
  const userId = req.auth.sub

  if (!status) {
    throw new HttpError(400, 'Status is required.')
  }

  // Build the update query dynamically
  let queryStr = ''
  let params = []

  if (status === 'COLLECTED') {
    queryStr = `
      UPDATE samples
      SET status = $1, barcode = COALESCE($2, barcode), collected_at = NOW(), collected_by = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `
    params = [status, barcode, userId, id]
  } else {
    queryStr = `
      UPDATE samples
      SET status = $1, barcode = COALESCE($2, barcode), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `
    params = [status, barcode, id]
  }

  const result = await pool.query(queryStr, params)

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Sample not found.')
  }

  const updatedSample = result.rows[0]
  await logAudit(userId, 'Update Sample', `Updated sample ${updatedSample.id} status to ${status}`)

  res.status(200).json(updatedSample)
}

module.exports = {
  listSamples,
  updateSample,
}
