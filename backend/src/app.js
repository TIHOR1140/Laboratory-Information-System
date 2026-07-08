const express = require('express')
const cors = require('cors')
const { clientUrl } = require('./config/env')
const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')
const userRoutes = require('./routes/userRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const testRoutes = require('./routes/testRoutes')
const sampleRoutes = require('./routes/sampleRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')
const resultRoutes = require('./routes/resultRoutes')
const { notFound, errorHandler } = require('./middleware/error')

function createApp() {
  const app = express()

  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LIS Authentication API' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/appointments', appointmentRoutes)
  app.use('/api/tests', testRoutes)
  app.use('/api/samples', sampleRoutes)
  app.use('/api/invoices', invoiceRoutes)
  app.use('/api/results', resultRoutes)



  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp