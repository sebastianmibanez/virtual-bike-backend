const crypto = require('crypto')
const fetch = require('node-fetch')

const PLACETOPAY_LOGIN = process.env.PLACETOPAY_LOGIN
const PLACETOPAY_TRANKEY = process.env.PLACETOPAY_TRANKEY
const PLACETOPAY_BASE_URL = process.env.PLACETOPAY_BASE_URL

function generateAuth() {
  const nonce = Math.random().toString(36).substring(7)
  const seed = Math.floor(Date.now() / 1000)
  const signature = crypto
    .createHash('sha256')
    .update(nonce + seed + PLACETOPAY_TRANKEY)
    .digest('hex')

  return { login: PLACETOPAY_LOGIN, nonce, seed, signature }
}

async function createPaymentSession(inscripcion) {
  const auth = generateAuth()

  const payload = {
    auth,
    locale: 'es_CL',
    expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    returnUrl: `${process.env.FRONTEND_URL}/#inscripcion`,
    cancelUrl: `${process.env.FRONTEND_URL}/#inscripcion`,
    notificationUrl: `${process.env.API_URL}/api/webhook`,
    reference: `inscripcion-${inscripcion.id}`,
    description: `Inscripción Clásica Virtual Bike 2026 - ${inscripcion.nombre} ${inscripcion.apellido}`,
    amount: {
      currency: 'CLP',
      total: 40000,
    },
    buyer: {
      name: inscripcion.nombre,
      surname: inscripcion.apellido,
      email: inscripcion.email,
      mobile: inscripcion.telefono,
      document: inscripcion.rut,
    },
  }

  try {
    const res = await fetch(`${PLACETOPAY_BASE_URL}session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok || !data.sessionId) {
      throw new Error(`PlaceToPay error: ${data.message || 'Unknown error'}`)
    }

    return {
      sessionId: data.sessionId,
      processUrl: data.processUrl,
    }
  } catch (err) {
    console.error('PlaceToPay error:', err.message)
    throw err
  }
}

module.exports = {
  createPaymentSession,
}
