import { createHmac } from 'node:crypto'

/**
 * Tarea programada de Netlify: cada 15 minutos le pide al sitio que mande las notificaciones pendientes.
 * La contraseña sale del mismo secreto que usa el sitio, así que no hay que configurar nada extra.
 */
export default async () => {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const site = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://puestalia.com').replace(/\/$/, '')
  if (!secret) return new Response('sin secreto', { status: 500 })
  const token = createHmac('sha256', secret).update('puestalia-push-cron').digest('base64url')
  const r = await fetch(site + '/api/push/run', { method: 'POST', headers: { authorization: 'Bearer ' + token } })
  console.log('push-cron', r.status, await r.text())
  return new Response('ok')
}

export const config = { schedule: '*/15 * * * *' }
