const express = require('express')
const cors = require('cors')
const inscribirRouter = require('./routes/inscribir')
const inscritosRouter = require('./routes/inscritos')
const webhookRouter = require('./routes/webhook')
const healthRouter = require('./routes/health')

const app = express()

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://virtual-bike.cl',
    'http://localhost:3000'
  ],
  credentials: true
}))

app.use(express.json())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use('/api/health', healthRouter)
app.use('/api/inscribir', inscribirRouter)
app.use('/api/inscritos', inscritosRouter)
app.use('/api/webhook', webhookRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

module.exports = app
