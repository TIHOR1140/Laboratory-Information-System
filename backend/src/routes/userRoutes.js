const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, required, minLength, email, phone, oneOf } = require('../utils/validation')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { listUsers, createUser, updateStatus } = require('../controllers/userController')

const router = express.Router()

router.use(authenticate, authorizeRoles('ADMIN'))

router.get('/', asyncHandler(listUsers))

router.post(
  '/',
  validateBody({
    firstName: [required('First name'), minLength('First name', 2)],
    lastName: [required('Last name'), minLength('Last name', 2)],
    email: [required('Email address'), email('Email address')],
    phone: [required('Phone'), phone('Phone')],
    password: [required('Password')],
    role: [required('Role'), oneOf('Role', ['RECEPTIONIST', 'TECHNICIAN'])],
  }),
  asyncHandler(createUser),
)

router.patch('/:id/status', asyncHandler(updateStatus))

module.exports = router