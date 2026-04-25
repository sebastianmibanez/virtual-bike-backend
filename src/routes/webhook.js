const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { enviarConfirmacion } = require('../services/email')

const router = express.Router()
const prisma = new PrismaClient()

router.post('/', async (req, res) => {
  try {
    const payload = req.body

    console.log('📬 Webhook recibido:', payload.reference)

    const reference = payload.reference
    if (!reference || !reference.startsWith('inscripcion-')) {
      return res.status(400).json({ error: 'Invalid reference' })
    }

    const inscripcionId = parseInt(reference.split('-')[1])

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: inscripcionId }
    })

    if (!inscripcion) {
      console.error(`❌ Inscripción no encontrada: ${inscripcionId}`)
      return res.status(404).json({ error: 'Inscripción no encontrada' })
    }

    const statusPago = payload.status?.status

    if (statusPago === 'APPROVED') {
      console.log(`✅ Pago aprobado para inscripción ${inscripcionId}`)

      await prisma.inscripcion.update({
        where: { id: inscripcionId },
        data: {
          status: 'completed',
          transactionId: payload.internalReference
        }
      })

      try {
        await enviarConfirmacion(inscripcion)
        console.log(`📧 Email de confirmación enviado a ${inscripcion.email}`)
      } catch (err) {
        console.error(`⚠️ Error enviando email: ${err.message}`)
      }

      await prisma.auditLog.create({
        data: {
          action: 'pago_confirmado',
          inscripcionId,
          details: JSON.stringify(payload)
        }
      })
    } else if (statusPago === 'REJECTED' || statusPago === 'CANCELLED') {
      console.log(`❌ Pago rechazado para inscripción ${inscripcionId}`)

      await prisma.inscripcion.update({
        where: { id: inscripcionId },
        data: { status: 'failed' }
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error en webhook:', err)
    res.status(500).json({ error: 'Error procesando webhook' })
  }
})

module.exports = router
