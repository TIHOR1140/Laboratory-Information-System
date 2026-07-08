const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { listSamples, updateSample } = require('../controllers/sampleController')

const router = express.Router()

router.use(authenticate, authorizeRoles('RECEPTIONIST', 'TECHNICIAN', 'ADMIN'))

router.get('/', asyncHandler(listSamples))
router.patch('/:id', asyncHandler(updateSample))

module.exports = router
