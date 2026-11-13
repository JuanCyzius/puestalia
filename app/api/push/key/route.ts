import { NextResponse } from 'next/server'
import { vapid } from '@/lib/push'

/** Clave pública para que el navegador pueda suscribirse a las notificaciones. */
export async function GET() {
  const v = vapid()
  return v ? NextResponse.json({ key: v.publicKey }) : NextResponse.json({ error: 'Notificaciones no configuradas.' }, { status: 503 })
}
