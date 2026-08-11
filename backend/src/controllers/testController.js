const pool = require('../config/db')
const HttpError = require('../utils/httpError')
const { logAudit } = require('../services/auditService')

async function listTests(req, res) {
  const result = await pool.query(`
    SELECT t.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', tp.id,
            'name', tp.name,
            'unit', tp.unit,
            'reference_range', tp.reference_range,
            'display_order', tp.display_order
          ) ORDER BY tp.display_order ASC, tp.created_at ASC
        ) FILTER (WHERE tp.id IS NOT NULL), '[]'
      ) as parameters
    FROM tests t
    LEFT JOIN test_parameters tp ON t.id = tp.test_id
    GROUP BY t.id
    ORDER BY t.category, t.name
  `)
  res.status(200).json({ tests: result.rows })
}

async function createTest(req, res) {
  const { name, code, category, price, reference_range, unit, parameters } = req.body

  if (!name || !code || !category || price === undefined) {
    throw new HttpError(400, 'Test name, code, category, and price are required.')
  }

  const paramList = Array.isArray(parameters) && parameters.length > 0
    ? parameters
    : [{ name: name.trim(), unit: (unit || '').trim(), reference_range: (reference_range || '').trim(), display_order: 1 }]

  for (const p of paramList) {
    if (!p.name || p.name.trim() === '') {
      throw new HttpError(400, 'Each parameter must have a valid name.')
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const mainRefRange = paramList.length > 1 ? 'Multi-Parameter Panel' : (paramList[0]?.reference_range || reference_range || '')
    const mainUnit = paramList.length > 1 ? 'Panel' : (paramList[0]?.unit || unit || '')

    const testRes = await client.query(
      `
        INSERT INTO tests (name, code, category, price, reference_range, unit)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [name.trim(), code.toUpperCase().trim(), category.trim(), price, mainRefRange, mainUnit]
    )

    const newTest = testRes.rows[0]
    const createdParams = []

    for (let index = 0; index < paramList.length; index++) {
      const p = paramList[index]
      const order = p.display_order !== undefined ? Number(p.display_order) : index + 1
      const pRes = await client.query(
        `
          INSERT INTO test_parameters (test_id, name, unit, reference_range, display_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, unit, reference_range, display_order
        `,
        [newTest.id, p.name.trim(), (p.unit || '').trim(), (p.reference_range || '').trim(), order]
      )
      createdParams.push(pRes.rows[0])
    }

    await client.query('COMMIT')
    await logAudit(req.auth.sub, 'Create Test', `Created test panel ${newTest.name} (${newTest.code}) with ${createdParams.length} parameter(s)`)

    res.status(201).json({
      ...newTest,
      parameters: createdParams
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function updateTest(req, res) {
  const { id } = req.params
  const { name, code, category, price, reference_range, unit, parameters } = req.body

  if (!name || !code || !category || price === undefined) {
    throw new HttpError(400, 'Test name, code, category, and price are required.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const checkRes = await client.query('SELECT id FROM tests WHERE id = $1', [id])
    if (checkRes.rows.length === 0) {
      throw new HttpError(404, 'Test not found.')
    }

    const paramList = Array.isArray(parameters) && parameters.length > 0
      ? parameters
      : [{ name: name.trim(), unit: (unit || '').trim(), reference_range: (reference_range || '').trim(), display_order: 1 }]

    const mainRefRange = paramList.length > 1 ? 'Multi-Parameter Panel' : (paramList[0]?.reference_range || reference_range || '')
    const mainUnit = paramList.length > 1 ? 'Panel' : (paramList[0]?.unit || unit || '')

    const testRes = await client.query(
      `
        UPDATE tests
        SET name = $1, code = $2, category = $3, price = $4, reference_range = $5, unit = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `,
      [name.trim(), code.toUpperCase().trim(), category.trim(), price, mainRefRange, mainUnit, id]
    )

    const updatedTest = testRes.rows[0]
    const keptParamIds = []
    const updatedParams = []

    for (let index = 0; index < paramList.length; index++) {
      const p = paramList[index]
      const order = p.display_order !== undefined ? Number(p.display_order) : index + 1

      if (p.id) {
        const upRes = await client.query(
          `
            UPDATE test_parameters
            SET name = $1, unit = $2, reference_range = $3, display_order = $4, updated_at = NOW()
            WHERE id = $5 AND test_id = $6
            RETURNING id, name, unit, reference_range, display_order
          `,
          [p.name.trim(), (p.unit || '').trim(), (p.reference_range || '').trim(), order, p.id, id]
        )
        if (upRes.rows.length > 0) {
          keptParamIds.push(upRes.rows[0].id)
          updatedParams.push(upRes.rows[0])
          continue
        }
      }

      const inRes = await client.query(
        `
          INSERT INTO test_parameters (test_id, name, unit, reference_range, display_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, unit, reference_range, display_order
        `,
        [id, p.name.trim(), (p.unit || '').trim(), (p.reference_range || '').trim(), order]
      )
      keptParamIds.push(inRes.rows[0].id)
      updatedParams.push(inRes.rows[0])
    }

    // Delete parameters that are no longer part of this test
    if (keptParamIds.length > 0) {
      await client.query(
        'DELETE FROM test_parameters WHERE test_id = $1 AND NOT (id = ANY($2))',
        [id, keptParamIds]
      )
    }

    await client.query('COMMIT')
    await logAudit(req.auth.sub, 'Update Test', `Updated test panel ${updatedTest.name} (${updatedTest.code})`)

    res.status(200).json({
      ...updatedTest,
      parameters: updatedParams.sort((a, b) => a.display_order - b.display_order)
    })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
