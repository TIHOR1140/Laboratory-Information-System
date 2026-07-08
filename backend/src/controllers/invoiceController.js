const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function listInvoices(req, res) {
  const result = await pool.query(`
    SELECT i.*, a.appointment_date, u.name as patient_name, u.email as patient_email
    FROM invoices i
    JOIN appointments a ON i.appointment_id = a.id
    JOIN users u ON a.patient_id = u.id
    ORDER BY i.created_at DESC
  `)
  res.status(200).json({ invoices: result.rows })
}

async function getInvoiceByAppointment(req, res) {
  const { appointmentId } = req.params
  
  const result = await pool.query(
    `
      SELECT i.*, a.appointment_date, u.name as patient_name, u.email as patient_email
      FROM invoices i
      JOIN appointments a ON i.appointment_id = a.id
      JOIN users u ON a.patient_id = u.id
      WHERE i.appointment_id = $1
    `,
    [appointmentId]
  )

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Invoice not found.')
  }

  const invoice = result.rows[0]
  const paymentsResult = await pool.query('SELECT * FROM payments WHERE invoice_id = $1', [invoice.id])

  res.status(200).json({
    invoice,
    payments: paymentsResult.rows
  })
}

async function collectPayment(req, res) {
  const { id } = req.params // invoice ID
  const { amount_paid, payment_method } = req.body
  const userId = req.auth.sub

  if (amount_paid === undefined || !payment_method) {
    throw new HttpError(400, 'Amount paid and payment method are required.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const checkResult = await client.query('SELECT * FROM invoices WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      throw new HttpError(404, 'Invoice not found.')
    }
    const invoice = checkResult.rows[0]

    // Log payment
    await client.query(
      `
        INSERT INTO payments (invoice_id, amount_paid, payment_method, collected_by)
        VALUES ($1, $2, $3, $4)
      `,
      [id, amount_paid, payment_method, userId]
    )

    // Sum up payments to verify if fully paid
    const sumResult = await client.query('SELECT SUM(amount_paid) as total FROM payments WHERE invoice_id = $1', [id])
    const totalPaid = parseFloat(sumResult.rows[0].total || 0)

    let paymentStatus = 'PENDING'
    if (totalPaid >= parseFloat(invoice.net_amount)) {
      paymentStatus = 'PAID'
    }

    // Update invoice status
    const updateResult = await client.query(
      `
        UPDATE invoices
        SET payment_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [paymentStatus, id]
    )

    await client.query('COMMIT')
    
    const updatedInvoice = updateResult.rows[0]
    await logAudit(userId, 'Collect Payment', `Collected ${amount_paid} via ${payment_method} for invoice ${id}`)

    res.status(200).json(updatedInvoice)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error;
  } finally {
    client.release()
  }
}

module.exports = {
  listInvoices,
  getInvoiceByAppointment,
  collectPayment,
}
