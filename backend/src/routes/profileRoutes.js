const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, optional, minLength, required, passwordStrength, matchesField } = require('../utils/validation')
const { authenticate } = require('../middleware/auth')
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController')

const router = express.Router()

router.get('/', authenticate, asyncHandler(getProfile))

router.put(
  '/',
  authenticate,
  validateBody({
    firstName: [optional([minLength('First name', 2)])],
    lastName: [optional([minLength('Last name', 2)])],
    phone: [optional([required('Phone')])],
    emergencyContactNumber: [optional([required('Emergency contact number')])],
    streetAddress: [optional([required('Street address')])],
    city: [optional([required('City')])],
    district: [optional([required('District')])],
    bloodGroup: [],
    allergies: [],
    medicalNotes: [],
  }),
  asyncHandler(updateProfile),
)

router.put(
  '/change-password',
  authenticate,
  validateBody({
    currentPassword: [required('Current password')],
    newPassword: [required('New password'), passwordStrength('New password')],
    confirmPassword: [required('Confirm password'), matchesField('newPassword', 'Confirm password')],
  }),
  asyncHandler(changePassword),
)

module.exports = router