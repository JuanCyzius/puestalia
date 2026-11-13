import { NextResponse } from 'next/server'
import { savePushSub } from '@/lib/db'
import { getUser } from '@/lib/session'
import { CATEGORIES, EXPERIENCES, MODALITIES } from '@/lib/types'

const only = (v: unknown, ok: Record<string, string>) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x in ok).slice(0, 20) : [])

/** Guarda (o actualiza) el celular de la persona y qué avisos quiere que le lleguen. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta para activar las notificaciones.' }, { status: 401 })
  const { subscription: s, cats, mods, exps } = await req.json().catch(() => ({}))
  const endpoint = s?.endpoint, p256dh = s?.keys?.p256dh, auth = s?.keys?.auth
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || typeof p256dh !== 'string' || typeof auth !== 'string')
    return NextResponse.json({ error: 'El navegador no mandó una suscripción válida.' }, { status: 400 })
  try {
    await savePushSub({ endpoint, p256dh, auth, user_id: user.id, cats: only(cats, CATEGORIES), mods: only(mods, MODALITIES), exps: only(exps, EXPERIENCES) })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo guardar: ' + (e as Error).message }, { status: 500 })
  }
}
