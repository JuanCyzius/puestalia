import { NextResponse } from 'next/server'
import { getSub } from '@/lib/db'
import { cancelSubscription } from '@/lib/mp'
import { getUser } from '@/lib/session'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta.' }, { status: 401 })
  const sub = await getSub(user.id)
  if (!sub?.mp_preapproval_id) return NextResponse.json({ error: 'No hay una suscripción para cancelar.' }, { status: 404 })
  try {
    await cancelSubscription(sub.mp_preapproval_id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo cancelar: ' + (e as Error).message }, { status: 502 })
  }
}
