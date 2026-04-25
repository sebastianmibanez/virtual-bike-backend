# Virtual Bike Backend

Backend Node.js para inscripciones de la Clásica Virtual Bike 2026.

## Endpoints

- `GET /api/health` — Health check
- `POST /api/inscribir` — Crear inscripción y sesión de pago
- `POST /api/webhook` — Webhook de PlaceToPay
- `GET /api/inscritos` — Descargar inscritos (CSV/JSON, requiere auth)

## Setup local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Deploy en Render

1. Conectar repo en Render
2. Configurar variables de entorno (ver `.env.example`)
3. Build command: `npm install && npx prisma migrate deploy`
4. Start command: `npm start`

## Variables de entorno

Ver `.env.example` para la lista completa.

Críticas para producción:
- `DATABASE_URL` (generada por Render)
- `PLACETOPAY_LOGIN` y `PLACETOPAY_TRANKEY`
- `RESEND_API_KEY`
- `ADMIN_TOKEN` (para CSV export)

## Estructura

```
src/
  index.js           — Entry point
  app.js             — Express setup
  routes/
    health.js        — Health check
    inscribir.js     — POST /api/inscribir
    inscritos.js     — GET /api/inscritos
    webhook.js       — POST /api/webhook
  services/
    placetopay.js    — Integración PlaceToPay
    email.js         — Envío de emails (Resend)
prisma/
  schema.prisma      — DB schema
```

## Auth

Endpoint `/api/inscritos` requiere:
```
Authorization: Bearer <ADMIN_TOKEN>
```
