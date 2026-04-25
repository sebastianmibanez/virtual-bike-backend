const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { createPaymentSession } = require('../services/placetopay')

const router = express.Router()
const prisma = new PrismaClient()

const CATEGORIAS_HOMBRE = [
  'Debutantes sin edad',
  'Menor 23 años',
  'Mayor 24 años',
  'Mayor 35 años Master',
  'Todo competidor y Sub/23',
  'Master A 30/39 años',
  'Master B 40/49 años',
  'Master C mayor 50 y más años',
]

const CATEGORIAS_MUJER = ['Damas']

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

router.post('/', async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, rut, genero, categoria, club } = req.body

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
    if (!apellido?.trim()) return res.status(400).json({ error: 'Apellido requerido' })
    if (!email?.trim()) return res.status(400).json({ error: 'Email requerido' })
    if (!telefono?.trim()) return res.status(400).json({ error: 'Teléfono requerido' })
    if (!rut?.trim()) return res.status(400).json({ error: 'RUT requerido' })
    if (!genero) return res.status(400).json({ error: 'Género requerido' })
    if (!categoria?.trim()) return res.status(400).json({ error: 'Categoría requerida' })

    if (!validarEmail(email)) return res.status(400).json({ error: 'Email inválido' })

    if (!['hombre', 'mujer'].includes(genero)) {
      return res.status(400).json({ error: 'Género inválido' })
    }

    const categoriasValidas = genero === 'hombre' ? CATEGORIAS_HOMBRE : CATEGORIAS_MUJER
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({ error: 'Categoría inválida para el género seleccionado' })
    }

    const existente = await prisma.inscripcion.findUnique({
      where: { rut }
    })

    if (existente) {
      return res.status(400).json({ error: 'Ya existe una inscripción con este RUT' })
    }

    const inscripcion = await prisma.inscripcion.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        rut: rut.trim(),
        genero,
        categoria,
        club: club?.trim() || null,
        status: 'pending',
      }
    })

    console.log(`✅ Inscripción creada: ${inscripcion.id} - ${inscripcion.nombre}`)

    let sessionData
    try {
      sessionData = await createPaymentSession(inscripcion)
    } catch (err) {
      await prisma.inscripcion.delete({ where: { id: inscripcion.id } })
      console.error('PlaceToPay error:', err.message)
      return res.status(500).json({ error: 'Error al procesar el pago. Intenta más tarde.' })
    }

    await prisma.inscripcion.update({
      where: { id: inscripcion.id },
      data: { sessionId: sessionData.sessionId }
    })

    await prisma.auditLog.create({
      data: {
        action: 'inscripcion_creada',
        inscripcionId: inscripcion.id,
        ipAddress: req.ip,
      }
    })

    res.json({
      redirect: sessionData.processUrl,
      sessionId: sessionData.sessionId,
      inscripcionId: inscripcion.id,
    })
  } catch (err) {
    console.error('Error en inscribir:', err)
    res.status(500).json({ error: 'Error al procesar la inscripción' })
  }
})

module.exports = router
