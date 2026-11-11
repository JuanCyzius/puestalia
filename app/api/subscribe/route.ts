import { NextResponse } from 'next/server'
import { getSub } from '@/lib/db'
import { createSubscription } from '@/lib/mp'
import { getUser, siteUrl } from '@/lib/session'

/** Crea la suscripción en Mercado Pago para el usuario logueado y devuelve a dónde ir a pagar. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta para suscribirte.' }, { status: 401 })
  if ((await getSub(user.id))?.status === 'authorized') return NextResponse.json({ error: 'Ya tenés Premium activo.' }, { status: 409 })
  const { payer_email } = await req.json().catch(() => ({}))
  const payer = typeof payer_email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer_email) ? payer_email.trim().toLowerCase() : user.email
  try {
    return NextResponse.json({ url: await createSubscription(user.id, payer, siteUrl()) })
  } catch (e) {
    return NextResponse.json({ error: 'Mercado Pago no pudo crear la suscripción: ' + (e as Error).message }, { status: 502 })
  }
}
