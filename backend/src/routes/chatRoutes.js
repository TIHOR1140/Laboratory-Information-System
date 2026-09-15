const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { handleChatMessage } = require('../controllers/chatController')

const router = express.Router()

router.post('/', asyncHandler(handleChatMessage))

module.exports = router
