const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, required, minLength, email, phone, beforeToday, passwordStrength, oneOf } = require('../utils/validation')
const { registerPatient, login, logout } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.post(
  '/register',
  validateBody({
    name: [required('Name'), minLength('Name', 2)],
    dateOfBirth: [beforeToday('Date of birth')],
    gender: [required('Gender'), oneOf('Gender', ['Male', 'Female', 'Other', 'Prefer not to say'])],
    email: [required('Email address'), email('Email address')],
    phone: [required('Phone number'), phone('Phone number')],
    password: [required('Password'), passwordStrength('Password')],
  }),
  asyncHandler(registerPatient),
)

router.post(
  '/login',
  validateBody({
    email: [required('Email address'), email('Email address')],
    password: [required('Password')],
  }),
  asyncHandler(login),
)

router.post('/logout', authenticate, asyncHandler(logout))

module.exports = router