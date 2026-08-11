const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function getResultsByAppointment(req, res) {
  const { appointmentId } = req.params

  const result = await pool.query(
    `
      SELECT tr.*, 
             t.name as test_name, 
             t.code as test_code, 
             COALESCE(tp.name, t.name) as parameter_name,
             COALESCE(tr.unit, tp.unit, t.unit) as unit,
             COALESCE(tr.reference_range, tp.reference_range, t.reference_range) as reference_range
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      LEFT JOIN test_parameters tp ON tr.parameter_id = tp.id
      WHERE tr.appointment_id = $1
      ORDER BY t.name, tp.display_order ASC, tr.created_at ASC
    `,
    [appointmentId]
  )

  res.status(200).json(result.rows)
}

async function submitResults(req, res) {
  const { appointmentId, results } = req.body // results is array of { testId, parameterId, resultValue, isNormal }
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
      const { testId, parameterId, resultValue, isNormal } = r
      if (!testId || resultValue === undefined) {
        throw new HttpError(400, 'Each result must include testId and resultValue.')
      }

      // Fetch unit & reference_range from parameter if available, else test
      let unit = r.unit || null
      let referenceRange = r.referenceRange || null

      if (!unit || !referenceRange) {
        if (parameterId) {
          const paramRes = await client.query('SELECT unit, reference_range FROM test_parameters WHERE id = $1', [parameterId])
          if (paramRes.rows.length > 0) {
            unit = unit || paramRes.rows[0].unit
            referenceRange = referenceRange || paramRes.rows[0].reference_range
          }
        }
        if (!unit || !referenceRange) {
          const testRes = await client.query('SELECT unit, reference_range FROM tests WHERE id = $1', [testId])
          if (testRes.rows.length > 0) {
            unit = unit || testRes.rows[0].unit
            referenceRange = referenceRange || testRes.rows[0].reference_range
          }
        }
      }

      await client.query(
        `
          INSERT INTO test_results (appointment_id, test_id, parameter_id, result_value, unit, reference_range, is_normal, entered_by, entered_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (appointment_id, test_id, parameter_id)
          DO UPDATE SET result_value = EXCLUDED.result_value, 
                        unit = EXCLUDED.unit,
                        reference_range = EXCLUDED.reference_range,
                        is_normal = EXCLUDED.is_normal, 
                        entered_by = EXCLUDED.entered_by, 
                        entered_at = NOW()
        `,
        [appointmentId, testId, parameterId || null, String(resultValue).trim(), unit, referenceRange, isNormal !== false, userId]
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

    // Broadcast real-time status update to all connected clients
    try {
      const socketService = require('../services/socketService')
      socketService.broadcast('status-update', {
        appointmentId,
        status: 'COMPLETED',
        message: 'New test results submitted!'
      })
    } catch (socketErr) {
      console.error('Failed to broadcast status update:', socketErr.message)
    }

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
      SELECT tr.*, 
             t.name as test_name, 
             t.code as test_code, 
             COALESCE(tp.name, t.name) as parameter_name,
             COALESCE(tr.unit, tp.unit, t.unit) as unit,
             COALESCE(tr.reference_range, tp.reference_range, t.reference_range) as reference_range
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      LEFT JOIN test_parameters tp ON tr.parameter_id = tp.id
      WHERE tr.appointment_id = $1
      ORDER BY t.name, tp.display_order ASC, tr.created_at ASC
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
