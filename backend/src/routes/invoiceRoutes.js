const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { listInvoices, getInvoiceByAppointment, collectPayment } = require('../controllers/invoiceController')

const router = express.Router()

router.use(authenticate)

// Receptionist, Admin roles can view all invoices
router.get('/', authorizeRoles('RECEPTIONIST', 'ADMIN'), asyncHandler(listInvoices))

// All roles (including Patient) can fetch invoice details for a specific appointment
router.get('/appointment/:appointmentId', asyncHandler(getInvoiceByAppointment))

// Payment collection restricted to receptionist and admin
router.post('/:id/payments', authorizeRoles('RECEPTIONIST', 'ADMIN'), asyncHandler(collectPayment))

module.exports = router
