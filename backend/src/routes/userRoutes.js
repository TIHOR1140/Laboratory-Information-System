const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, required, minLength, email, phone, oneOf } = require('../utils/validation')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { listUsers, createUser, updateStatus, listAuditLogs } = require('../controllers/userController')

const router = express.Router()

router.get('/', authenticate, authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(listUsers))
router.get('/audit-logs', authenticate, authorizeRoles('ADMIN'), asyncHandler(listAuditLogs))

router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'RECEPTIONIST'),
  validateBody({
    firstName: [required('First name'), minLength('First name', 2)],
    lastName: [required('Last name'), minLength('Last name', 2)],
    email: [required('Email address'), email('Email address')],
    phone: [required('Phone'), phone('Phone')],
    password: [required('Password')],
    role: [required('Role'), oneOf('Role', ['RECEPTIONIST', 'TECHNICIAN', 'PATIENT', 'ADMIN'])],
  }),
  asyncHandler(createUser),
)

router.patch('/:id/status', authenticate, authorizeRoles('ADMIN'), asyncHandler(updateStatus))

module.exports = router