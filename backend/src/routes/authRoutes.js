const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, required, minLength, email, phone, beforeToday, passwordStrength, oneOf } = require('../utils/validation')
const { registerPatient, login, logout, setupTwoFactor, enableTwoFactor, disableTwoFactor, requestDisableTwoFactor, verifyTwoFactorLogin, resendTwoFactor } = require('../controllers/authController')
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

router.post('/setup-2fa', authenticate, asyncHandler(setupTwoFactor))
router.post('/confirm-2fa', authenticate, asyncHandler(enableTwoFactor))
router.post('/disable-2fa', authenticate, asyncHandler(disableTwoFactor))
router.post('/request-disable-2fa', authenticate, asyncHandler(requestDisableTwoFactor))
router.post('/verify-2fa', asyncHandler(verifyTwoFactorLogin))
router.post('/resend-2fa', asyncHandler(resendTwoFactor))

module.exports = router