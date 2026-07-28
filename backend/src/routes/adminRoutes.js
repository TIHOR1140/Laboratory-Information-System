const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const {
  listActivity,
  listTests,
  createTest,
  updateTest,
  deleteTest,
  listTemplates,
  createTemplate,
  updateTemplate,
  listSessions,
  revokeSession,
  listAuditLogsFull,
} = require('../controllers/adminController')

const router = express.Router()

// Admin-only routes for dashboards, test catalogues, and report templates.
router.use(authenticate, authorizeRoles('ADMIN'))

router.get('/activity', asyncHandler(listActivity))
router.get('/sessions', asyncHandler(listSessions))
router.delete('/sessions/:jti', asyncHandler(revokeSession))
router.get('/audit-logs-full', asyncHandler(listAuditLogsFull))
router.get('/tests', asyncHandler(listTests))
router.post('/tests', asyncHandler(createTest))
router.put('/tests/:id', asyncHandler(updateTest))
router.delete('/tests/:id', asyncHandler(deleteTest))
router.get('/templates', asyncHandler(listTemplates))
router.post('/templates', asyncHandler(createTemplate))
router.put('/templates/:id', asyncHandler(updateTemplate))

module.exports = router
