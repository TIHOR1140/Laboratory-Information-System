const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function getResultsByAppointment(req, res) {
  const { appointmentId } = req.params

  const result = await pool.query(
    `
      SELECT tr.*, t.name as test_name, t.code as test_code, t.reference_range, t.unit
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.appointment_id = $1
    `,
    [appointmentId]
  )

  res.status(200).json(result.rows)
}

async function submitResults(req, res) {
  const { appointmentId, results } = req.body // results is array of { testId, resultValue, isNormal }
  const userId = req.auth.sub

  if (!appointmentId || !results || !Array.isArray(results) || results.length === 0) {
    throw new HttpError(400, 'Appointment ID and results array are required.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify appointment exists
    const apptResult = await client.query('SELECT status FROM appointments WHERE id = $1', [appointmentId])
    if (apptResult.rows.length === 0) {
      throw new HttpError(404, 'Appointment not found.')
    }

    // Insert/upsert each result
    for (const r of results) {
      const { testId, resultValue, isNormal } = r
      if (!testId || resultValue === undefined) {
        throw new HttpError(400, 'Each result must include testId and resultValue.')
      }

      await client.query(
        `
          INSERT INTO test_results (appointment_id, test_id, result_value, is_normal, entered_by, entered_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (appointment_id, test_id)
          DO UPDATE SET result_value = EXCLUDED.result_value, is_normal = EXCLUDED.is_normal, entered_by = EXCLUDED.entered_by, entered_at = NOW()
        `,
        [appointmentId, testId, String(resultValue).trim(), isNormal !== false, userId]
      )
    }

    // Mark appointment as COMPLETED
    await client.query(
      `
        UPDATE appointments
        SET status = 'COMPLETED', updated_at = NOW()
        WHERE id = $1
      `,
      [appointmentId]
    )

    // Mark samples as COMPLETED
    await client.query(
      `
        UPDATE samples
        SET status = 'COMPLETED', updated_at = NOW()
        WHERE appointment_id = $1
      `,
      [appointmentId]
    )

    await client.query('COMMIT')

    await logAudit(userId, 'Submit Test Results', `Submitted ${results.length} test results for appointment ${appointmentId} and completed tests`)

    res.status(200).json({ message: 'Results submitted successfully and appointment marked as completed.' })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error;
  } finally {
    client.release()
  }
}

async function verifyReport(req, res) {
  const { barcode } = req.params

  if (!barcode) {
    throw new HttpError(400, 'Barcode identifier is required.')
  }

  // Find appointment by barcode
  const apptResult = await pool.query(
    `
      SELECT a.*, u.name as patient_name, u.email as patient_email,
             s.barcode, s.status as sample_status,
             i.id as invoice_id, i.net_amount, i.payment_status
      FROM appointments a
      JOIN samples s ON a.id = s.appointment_id
      JOIN users u ON a.patient_id = u.id
      LEFT JOIN invoices i ON a.id = i.appointment_id
      WHERE s.barcode = $1
    `,
    [barcode]
  )

  if (apptResult.rows.length === 0) {
    throw new HttpError(404, 'No matching clinical record found for this barcode.')
  }

  const appointment = apptResult.rows[0]

  // Fetch test results for this appointment
  const resultsResult = await pool.query(
    `
      SELECT tr.*, t.name as test_name, t.code as test_code, t.reference_range, t.unit
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.appointment_id = $1
    `,
    [appointment.id]
  )

  res.status(200).json({
    appointment,
    results: resultsResult.rows,
  })
}

module.exports = {
  getResultsByAppointment,
  submitResults,
  verifyReport,
}
