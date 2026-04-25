const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const horariosPorCategoria = {
  'Damas': '09:00 AM',
  'Debutantes sin edad': '09:20 AM',
  'Menor 23 años': '09:20 AM',
  'Mayor 24 años': '09:20 AM',
  'Mayor 35 años Master': '09:20 AM',
  'Todo competidor y Sub/23': '09:20 AM',
  'Master A 30/39 años': '09:20 AM',
  'Master B 40/49 años': '09:20 AM',
  'Master C mayor 50 y más años': '09:20 AM',
}

function getHorarioCategoria(categoria) {
  return horariosPorCategoria[categoria] || '09:20 AM'
}

async function enviarConfirmacion(inscripcion) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: #f5e400; color: black; padding: 20px; text-align: center; margin-bottom: 20px; }
    .content { background: white; padding: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .section h3 { color: #f5e400; margin-bottom: 10px; }
    .info-box { background: #f0f0f0; padding: 15px; margin: 10px 0; border-left: 4px solid #f5e400; }
    .checklist { list-style: none; padding: 0; }
    .checklist li { padding: 8px 0; }
    .checklist li:before { content: "✓ "; color: #f5e400; font-weight: bold; margin-right: 8px; }
    .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
    a { color: #f5e400; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Inscripción Confirmada!</h1>
      <p>Clásica Virtual Bike 2026</p>
    </div>

    <div class="content">
      <p>Hola <strong>${inscripcion.nombre}</strong>,</p>
      <p>Tu inscripción a la <strong>Clásica Virtual Bike 2026</strong> ha sido confirmada exitosamente.</p>

      <div class="section">
        <h3>📅 Detalles del Evento</h3>
        <div class="info-box">
          <p><strong>Fecha:</strong> 21 de Mayo 2026</p>
          <p><strong>Lugar:</strong> Alto Noviciado, Lampa</p>
          <p><strong>Categoría:</strong> ${inscripcion.categoria}</p>
          <p><strong>Número de Orden:</strong> #${inscripcion.id}</p>
        </div>
      </div>

      <div class="section">
        <h3>🕐 Horarios</h3>
        <div class="info-box">
          <p><strong>Acreditación:</strong> 08:00 AM</p>
          <p><strong>Tu Largada:</strong> ${getHorarioCategoria(inscripcion.categoria)}</p>
        </div>
      </div>

      <div class="section">
        <h3>✨ Incluido con tu Inscripción</h3>
        <ul class="checklist">
          <li>Medallón finisher (primeros 200 inscritos)</li>
          <li>Fotos y videos profesionales GRATIS</li>
          <li>3 metas volantes con premios en dinero</li>
          <li>Tercer tiempo (frutas, agua, pan y pastelitos)</li>
          <li>Sorteos de premios</li>
          <li>Tricota de Champion al 1° lugar</li>
        </ul>
      </div>

      <div class="section">
        <h3>❓ ¿Preguntas?</h3>
        <p>Contáctanos por WhatsApp: <a href="https://wa.me/56999542821">+56 9 9954 2821</a></p>
      </div>
    </div>

    <div class="footer">
      <p>Virtual-Bike.cl | Clásica CVBK 2026</p>
      <p>Este es un correo automatizado, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    const result = await resend.emails.send({
      from: `Virtual-Bike.cl <${ADMIN_EMAIL}>`,
      to: inscripcion.email,
      subject: '¡Inscripción confirmada! — Clásica Virtual Bike 2026',
      html: htmlContent,
    })

    console.log(`📧 Email enviado a ${inscripcion.email}:`, result)
    return result
  } catch (err) {
    console.error('Error enviando email:', err.message)
    throw err
  }
}

module.exports = {
  enviarConfirmacion,
}
