const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const { listTests, createTest, updateTest, deleteTest } = require('../controllers/testController')

const router = express.Router()

// All authenticated roles can fetch the list of tests
router.get('/', authenticate, asyncHandler(listTests))

// Only Admin can perform modifications
router.post('/', authenticate, authorizeRoles('ADMIN'), asyncHandler(createTest))
router.put('/:id', authenticate, authorizeRoles('ADMIN'), asyncHandler(updateTest))
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), asyncHandler(deleteTest))

module.exports = router
