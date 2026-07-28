const { Server } = require('socket.io')
const { clientUrl } = require('../config/env')

let io = null

function init(server) {
  io = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log(`🔌 WebSockets: Client connected [id=${socket.id}]`)

    socket.on('join', (room) => {
      socket.join(room)
      console.log(`👥 WebSockets: Client [id=${socket.id}] joined room [${room}]`)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 WebSockets: Client disconnected [id=${socket.id}]`)
    })
  })

  return io
}

function getIO() {
  return io
}

function broadcast(event, data) {
  if (io) {
    io.emit(event, data)
  }
}

function emitToRoom(room, event, data) {
  if (io) {
    io.to(room).emit(event, data)
  }
}

module.exports = {
  init,
  getIO,
  broadcast,
  emitToRoom,
}
