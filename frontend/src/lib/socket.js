import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5000'

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
})

socket.on('connect', () => {
  console.log('⚡ WebSockets: Connected to server')
})

socket.on('disconnect', () => {
  console.log('⚡ WebSockets: Disconnected from server')
})
