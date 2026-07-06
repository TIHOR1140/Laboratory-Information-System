const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

// Normalize database rows into the shape expected by the admin UI.
function mapTest(row) {
  return {
    id: row.id,
    testCode: row.test_code,
    name: row.name,
    category: row.category,
    price: row.price,
    minRange: row.min_range,
    maxRange: row.max_range,
    unit: row.unit,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    header: row.header,
    footer: row.footer,
    logoUrl: row.logo_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function listActivity(req, res) {
  const result = await pool.query(
    `
      SELECT id, action, description, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 8
    `,
  )

  return res.status(200).json({ activity: result.rows })
}

async function listTests(req, res) {
  const result = await pool.query(
    `
      SELECT id, test_code, name, category, price, min_range, max_range, unit, description, is_active, created_at, updated_at
      FROM tests
      ORDER BY created_at DESC
    `,
  )

  return res.status(200).json({ tests: result.rows.map(mapTest) })
}

async function createTest(req, res) {
  const { testCode, name, category, price, minRange, maxRange, unit, description, isActive = true } = req.body

  if (!testCode || !name || !price) {
    throw new HttpError(400, 'Test code, name, and price are required.')
  }

  const existing = await pool.query('SELECT id FROM tests WHERE test_code = $1', [String(testCode).trim()])
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'A test with that code already exists.')
  }

  const result = await pool.query(
    `
      INSERT INTO tests (test_code, name, category, price, min_range, max_range, unit, description, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, test_code, name, category, price, min_range, max_range, unit, description, is_active, created_at, updated_at
    `,
    [String(testCode).trim(), String(name).trim(), category ? String(category).trim() : null, Number(price), minRange === null || minRange === undefined || minRange === '' ? null : Number(minRange), maxRange === null || maxRange === undefined || maxRange === '' ? null : Number(maxRange), unit ? String(unit).trim() : null, description ? String(description).trim() : null, Boolean(isActive)],
  )

  await logAudit(req.auth?.sub || req.auth?.userId, 'Test Creation', `Created test ${result.rows[0].name}.`)

  return res.status(201).json({ test: mapTest(result.rows[0]) })
}

async function updateTest(req, res) {
  const { id } = req.params
  const { testCode, name, category, price, minRange, maxRange, unit, description, isActive = true } = req.body

  const result = await pool.query(
    `
      UPDATE tests
      SET test_code = $1, name = $2, category = $3, price = $4, min_range = $5, max_range = $6, unit = $7, description = $8, is_active = $9, updated_at = NOW()
      WHERE id = $10
    `,
    [String(testCode).trim(), String(name).trim(), category ? String(category).trim() : null, Number(price), minRange === null || minRange === undefined || minRange === '' ? null : Number(minRange), maxRange === null || maxRange === undefined || maxRange === '' ? null : Number(maxRange), unit ? String(unit).trim() : null, description ? String(description).trim() : null, Boolean(isActive), id],
  )

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Test not found.')
  }

  const updated = await pool.query(
    `SELECT id, test_code, name, category, price, min_range, max_range, unit, description, is_active, created_at, updated_at FROM tests WHERE id = $1`,
    [id],
  )

  await logAudit(req.auth?.sub || req.auth?.userId, 'Test Update', `Updated test ${updated.rows[0].name}.`)

  return res.status(200).json({ test: mapTest(updated.rows[0]) })
}

async function deleteTest(req, res) {
  const { id } = req.params
  const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING id', [id])

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Test not found.')
  }

  await logAudit(req.auth?.sub || req.auth?.userId, 'Test Delete', `Deleted test entry ${id}.`)

  return res.status(200).json({ message: 'Test deleted successfully.' })
}

async function listTemplates(req, res) {
  const result = await pool.query(
    `
      SELECT id, name, header, footer, logo_url, notes, created_at, updated_at
      FROM report_templates
      ORDER BY created_at DESC
    `,
  )

  return res.status(200).json({ templates: result.rows.map(mapTemplate) })
}

async function createTemplate(req, res) {
  const { name, header, footer, logoUrl, notes } = req.body

  if (!name) {
    throw new HttpError(400, 'Template name is required.')
  }

  const result = await pool.query(
    `
      INSERT INTO report_templates (name, header, footer, logo_url, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, header, footer, logo_url, notes, created_at, updated_at
    `,
    [String(name).trim(), header ? String(header).trim() : null, footer ? String(footer).trim() : null, logoUrl ? String(logoUrl).trim() : null, notes ? String(notes).trim() : null],
  )

  await logAudit(req.auth?.sub || req.auth?.userId, 'Template Creation', `Created template ${result.rows[0].name}.`)

  return res.status(201).json({ template: mapTemplate(result.rows[0]) })
}

async function updateTemplate(req, res) {
  const { id } = req.params
  const { name, header, footer, logoUrl, notes } = req.body

  const result = await pool.query(
    `
      UPDATE report_templates
      SET name = $1, header = $2, footer = $3, logo_url = $4, notes = $5, updated_at = NOW()
      WHERE id = $2
    `,
    [String(name).trim(), header ? String(header).trim() : null, footer ? String(footer).trim() : null, logoUrl ? String(logoUrl).trim() : null, notes ? String(notes).trim() : null, id],
  )

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Template not found.')
  }

  const updated = await pool.query(
    `SELECT id, name, header, footer, logo_url, notes, created_at, updated_at FROM report_templates WHERE id = $1`,
    [id],
  )

  await logAudit(req.auth?.sub || req.auth?.userId, 'Template Update', `Updated template ${updated.rows[0].name}.`)

  return res.status(200).json({ template: mapTemplate(updated.rows[0]) })
}

module.exports = {
  listActivity,
  listTests,
  createTest,
  updateTest,
  deleteTest,
  listTemplates,
  createTemplate,
  updateTemplate,
}
