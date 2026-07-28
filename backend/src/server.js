require('dotenv').config()
const http = require('http')

const createApp = require('./app')
const { port } = require('./config/env')
const socketService = require('./services/socketService')

const app = createApp()
const server = http.createServer(app)

// Initialize WebSockets
socketService.init(server)

server.listen(port, () => {
  console.log(`LIS auth API with WebSockets running on http://localhost:${port}`)
})