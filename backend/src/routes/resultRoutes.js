const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { getResultsByAppointment, submitResults, verifyReport } = require('../controllers/resultController')

const router = express.Router()

// Public verification route (bypasses check authentication)
router.get('/verify/:barcode', asyncHandler(verifyReport))

router.use(authenticate)

// All roles can retrieve results of an appointment
router.get('/appointment/:appointmentId', asyncHandler(getResultsByAppointment))

// Technicians and Admins can log/submit laboratory test results
router.post('/', authorizeRoles('TECHNICIAN', 'ADMIN'), asyncHandler(submitResults))

module.exports = router
