require('dotenv').config()

const createApp = require('./app')
const { port } = require('./config/env')

const app = createApp()

app.listen(port, () => {
  console.log(`LIS auth API running on http://localhost:${port}`)
})