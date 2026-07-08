const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function listTests(req, res) {
  const result = await pool.query('SELECT * FROM tests ORDER BY category, name')
  res.status(200).json({ tests: result.rows })
}

async function createTest(req, res) {
  const { name, code, category, price, reference_range, unit } = req.body

  if (!name || !code || !category || price === undefined || !reference_range || !unit) {
    throw new HttpError(400, 'All fields are required: name, code, category, price, reference_range, unit.')
  }

  const result = await pool.query(
    `
      INSERT INTO tests (name, code, category, price, reference_range, unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [name, code.toUpperCase().trim(), category.trim(), price, reference_range.trim(), unit.trim()]
  )

  const newTest = result.rows[0]
  await logAudit(req.auth.sub, 'Create Test', `Created test ${newTest.name} (${newTest.code})`)

  res.status(201).json(newTest)
}

async function updateTest(req, res) {
  const { id } = req.params
  const { name, code, category, price, reference_range, unit } = req.body

  if (!name || !code || !category || price === undefined || !reference_range || !unit) {
    throw new HttpError(400, 'All fields are required: name, code, category, price, reference_range, unit.')
  }

  const result = await pool.query(
    `
      UPDATE tests
      SET name = $1, code = $2, category = $3, price = $4, reference_range = $5, unit = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `,
    [name, code.toUpperCase().trim(), category.trim(), price, reference_range.trim(), unit.trim(), id]
  )

  if (result.rows.length === 0) {
    throw new HttpError(404, 'Test not found.')
  }

  const updatedTest = result.rows[0]
  await logAudit(req.auth.sub, 'Update Test', `Updated test ${updatedTest.name} (${updatedTest.code})`)

  res.status(200).json(updatedTest)
}

async function deleteTest(req, res) {
  const { id } = req.params

  const checkResult = await pool.query('SELECT name, code FROM tests WHERE id = $1', [id])
  if (checkResult.rows.length === 0) {
    throw new HttpError(404, 'Test not found.')
  }

  const test = checkResult.rows[0]

  await pool.query('DELETE FROM tests WHERE id = $1', [id])
  await logAudit(req.auth.sub, 'Delete Test', `Deleted test ${test.name} (${test.code})`)

  res.status(200).json({ message: 'Test deleted successfully.' })
}

module.exports = {
  listTests,
  createTest,
  updateTest,
  deleteTest,
}
