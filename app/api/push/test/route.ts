import { NextResponse } from 'next/server'
import { getPushSub } from '@/lib/db'
import { send } from '@/lib/push'
import { getUser } from '@/lib/session'

/** Manda una notificación de prueba a este celular. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta.' }, { status: 401 })
  const { endpoint } = await req.json().catch(() => ({}))
  const s = typeof endpoint === 'string' ? await getPushSub(endpoint) : null
  if (!s || s.user_id !== user.id) return NextResponse.json({ error: 'Este celular no tiene las notificaciones activadas.' }, { status: 404 })
  try {
    await send(s, { title: 'Puestalia', body: 'Listo: así te van a llegar las ofertas nuevas.', url: '/', tag: 'puestalia-test' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo enviar: ' + (e as Error).message }, { status: 502 })
  }
}
