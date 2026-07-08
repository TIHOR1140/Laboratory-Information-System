const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { validateBody, required } = require('../utils/validation')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const {
  getPatientAppointments,
  listAllAppointments,
  createAppointment,
  createAppointmentByStaff,
  checkInAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController')

const router = express.Router()

router.use(authenticate)

// Get patient's own appointments
router.get('/', authorizeRoles('PATIENT'), asyncHandler(getPatientAppointments))

// Get all appointments (staff)
router.get('/all', authorizeRoles('RECEPTIONIST', 'TECHNICIAN', 'ADMIN'), asyncHandler(listAllAppointments))

// Patient schedules appointment
router.post(
  '/',
  authorizeRoles('PATIENT'),
  validateBody({
    appointment_date: [required('Appointment date')],
    reason: [required('Reason')],
  }),
  asyncHandler(createAppointment),
)

// Staff schedules appointment
router.post(
  '/staff',
  authorizeRoles('RECEPTIONIST', 'ADMIN'),
  asyncHandler(createAppointmentByStaff),
)

// Check in patient & collect sample barcode
router.post(
  '/:id/check-in',
  authorizeRoles('RECEPTIONIST', 'ADMIN'),
  asyncHandler(checkInAppointment),
)

// Cancel appointment
router.patch('/:id/cancel', authorizeRoles('PATIENT', 'RECEPTIONIST', 'ADMIN'), asyncHandler(cancelAppointment))

module.exports = router
