const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { logAudit } = require('../services/auditService');

async function getPatientAppointments(req, res) {
  const patientId = req.auth.sub;

  const result = await pool.query(
    `
      SELECT a.*, 
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'code', t.code, 'price', t.price, 'reference_range', t.reference_range, 'unit', t.unit)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tests,
        i.net_amount, i.payment_status,
        s.barcode, s.status as sample_status
      FROM appointments a
      LEFT JOIN appointment_tests ast ON a.id = ast.appointment_id
      LEFT JOIN tests t ON ast.test_id = t.id
      LEFT JOIN invoices i ON a.id = i.appointment_id
      LEFT JOIN samples s ON a.id = s.appointment_id
      WHERE a.patient_id = $1
      GROUP BY a.id, i.net_amount, i.payment_status, s.barcode, s.status
      ORDER BY a.appointment_date DESC
    `,
    [patientId]
  );

  res.status(200).json(result.rows);
}

async function listAllAppointments(req, res) {
  const result = await pool.query(
    `
      SELECT a.*, u.name as patient_name, u.email as patient_email,
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'code', t.code, 'price', t.price, 'reference_range', t.reference_range, 'unit', t.unit)
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) as tests,
        i.id as invoice_id, i.net_amount, i.payment_status,
        s.id as sample_id, s.barcode, s.status as sample_status
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      LEFT JOIN appointment_tests ast ON a.id = ast.appointment_id
      LEFT JOIN tests t ON ast.test_id = t.id
      LEFT JOIN invoices i ON a.id = i.appointment_id
      LEFT JOIN samples s ON a.id = s.appointment_id
      GROUP BY a.id, u.name, u.email, i.id, i.net_amount, i.payment_status, s.id, s.barcode, s.status
      ORDER BY a.appointment_date DESC
    `
  );
  res.status(200).json(result.rows);
}

async function createAppointment(req, res) {
  const patientId = req.auth.sub;
  const { appointment_date, reason, testIds } = req.body;

  if (!appointment_date || !reason) {
    throw new HttpError(400, 'Appointment date and reason are required.');
  }

  if (new Date(appointment_date) < new Date()) {
    throw new HttpError(400, 'Appointment date cannot be in the past.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create appointment
    const apptResult = await client.query(
      `
        INSERT INTO appointments (patient_id, appointment_date, reason)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [patientId, appointment_date, reason]
    );
    const newAppointment = apptResult.rows[0];

    // If tests selected, link them, generate invoice and sample record
    if (testIds && testIds.length > 0) {
      for (const testId of testIds) {
        await client.query(
          'INSERT INTO appointment_tests (appointment_id, test_id) VALUES ($1, $2)',
          [newAppointment.id, testId]
        );
      }

      // Calculate Total Cost
      const priceResult = await client.query(
        'SELECT SUM(price) as total FROM tests WHERE id = ANY($1)',
        [testIds]
      );
      const totalAmount = parseFloat(priceResult.rows[0].total || 0);

      // Create Invoice
      await client.query(
        `
          INSERT INTO invoices (appointment_id, total_amount, net_amount, payment_status)
          VALUES ($1, $2, $3, 'PENDING')
        `,
        [newAppointment.id, totalAmount, totalAmount]
      );

      // Create Pending Sample Record
      await client.query(
        'INSERT INTO samples (appointment_id, status) VALUES ($1, \'PENDING\')',
        [newAppointment.id]
      );
    }

    await client.query('COMMIT');

    await logAudit(
      patientId,
      'Create Appointment',
      `New appointment scheduled for ${newAppointment.appointment_date} with ${testIds ? testIds.length : 0} tests`
    );

    res.status(201).json(newAppointment);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createAppointmentByStaff(req, res) {
  const staffId = req.auth.sub;
  const { patientId, appointment_date, reason, testIds } = req.body;

  if (!patientId || !appointment_date || !reason || !testIds || testIds.length === 0) {
    throw new HttpError(400, 'Patient ID, appointment date, reason, and testIds are required.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptResult = await client.query(
      `
        INSERT INTO appointments (patient_id, appointment_date, reason)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [patientId, appointment_date, reason]
    );
    const newAppointment = apptResult.rows[0];

    for (const testId of testIds) {
      await client.query(
        'INSERT INTO appointment_tests (appointment_id, test_id) VALUES ($1, $2)',
        [newAppointment.id, testId]
      );
    }

    const priceResult = await client.query(
      'SELECT SUM(price) as total FROM tests WHERE id = ANY($1)',
      [testIds]
    );
    const totalAmount = parseFloat(priceResult.rows[0].total || 0);

    await client.query(
      `
        INSERT INTO invoices (appointment_id, total_amount, net_amount, payment_status)
        VALUES ($1, $2, $3, 'PENDING')
      `,
      [newAppointment.id, totalAmount, totalAmount]
    );

    await client.query(
      'INSERT INTO samples (appointment_id, status) VALUES ($1, \'PENDING\')',
      [newAppointment.id]
    );

    await client.query('COMMIT');

    await logAudit(
      staffId,
      'Staff Create Appointment',
      `Scheduled appointment for patient ${patientId} on ${newAppointment.appointment_date}`
    );

    res.status(201).json(newAppointment);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function checkInAppointment(req, res) {
  const { id } = req.params;
  const staffId = req.auth.sub;
  const barcode = 'BAR-' + Math.floor(100000 + Math.random() * 900000); // Generate simple unique barcode

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptCheck = await client.query('SELECT status FROM appointments WHERE id = $1', [id]);
    if (apptCheck.rows.length === 0) {
      throw new HttpError(404, 'Appointment not found.');
    }

    // Update appointment status to complete/scheduled checked in? We can just keep it SCHEDULED or mark checked-in. Let's keep it scheduled but update the sample
    // Update sample status to 'COLLECTED' and assign barcode
    const sampleUpdate = await client.query(
      `
        UPDATE samples
        SET status = 'COLLECTED', barcode = $1, collected_at = NOW(), collected_by = $2, updated_at = NOW()
        WHERE appointment_id = $3
        RETURNING *
      `,
      [barcode, staffId, id]
    );

    if (sampleUpdate.rows.length === 0) {
      // If sample wasn't created yet, create it now!
      await client.query(
        `
          INSERT INTO samples (appointment_id, barcode, status, collected_at, collected_by)
          VALUES ($1, $2, 'COLLECTED', NOW(), $3)
        `,
        [id, barcode, staffId]
      );
    }

    await client.query('COMMIT');

    await logAudit(
      staffId,
      'Check In Appointment',
      `Checked in appointment ${id} and generated barcode ${barcode}`
    );

    res.status(200).json({ message: 'Patient checked in successfully.', barcode });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cancelAppointment(req, res) {
  const patientId = req.auth.sub;
  const userRole = req.auth.role;
  const { id } = req.params;

  let queryStr = '';
  let params = [];

  if (userRole === 'RECEPTIONIST' || userRole === 'ADMIN') {
    queryStr = `
      UPDATE appointments
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = $1 AND status = 'SCHEDULED'
      RETURNING *
    `;
    params = [id];
  } else {
    queryStr = `
      UPDATE appointments
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = $1 AND patient_id = $2 AND status = 'SCHEDULED'
      RETURNING *
    `;
    params = [id, patientId];
  }

  const result = await pool.query(queryStr, params);

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Appointment not found or cannot be cancelled.');
  }

  const cancelledAppointment = result.rows[0];

  await logAudit(
    req.auth.sub,
    'Cancel Appointment',
    `Appointment for ${cancelledAppointment.appointment_date} was cancelled`
  );

  res.status(200).json(cancelledAppointment);
}

module.exports = {
  getPatientAppointments,
  listAllAppointments,
  createAppointment,
  createAppointmentByStaff,
  checkInAppointment,
  cancelAppointment,
};
