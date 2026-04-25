const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

function validarToken(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return false
  }

  const token = auth.substring(7)
  return token === process.env.ADMIN_TOKEN
}

function generarCSV(inscritos) {
  const BOM = '﻿'

  const headers = ['RUT', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Género', 'Categoría', 'Club', 'Estado', 'Fecha']
  const rows = inscritos.map(i => [
    i.rut,
    i.nombre,
    i.apellido,
    i.email,
    i.telefono,
    i.genero,
    i.categoria,
    i.club || '',
    i.status,
    i.createdAt.toISOString()
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return BOM + csv
}

router.get('/', async (req, res) => {
  try {
    if (!validarToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { format = 'csv', status = 'completed' } = req.query

    const query = {}
    if (status !== 'all') {
      query.status = status
    }

    const inscritos = await prisma.inscripcion.findMany({
      where: query,
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📊 Descargando ${inscritos.length} inscritos (status: ${status})`)

    await prisma.auditLog.create({
      data: {
        action: 'csv_descargado',
        adminEmail: req.query.admin || 'unknown',
        ipAddress: req.ip,
        details: `${inscritos.length} registros, formato: ${format}, status: ${status}`
      }
    })

    if (format === 'json') {
      res.json(inscritos)
    } else {
      const csv = generarCSV(inscritos)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="inscritos-cvbk-2026.csv"')
      res.send(csv)
    }
  } catch (err) {
    console.error('Error en inscritos:', err)
    res.status(500).json({ error: 'Error descargando inscritos' })
  }
})

module.exports = router
