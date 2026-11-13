import { NextResponse } from 'next/server'
import { passesReady } from '@/lib/db'
import { createPass } from '@/lib/mp'
import { getUser, siteUrl } from '@/lib/session'

/** Crea el pago único del pase de 30 días para el usuario logueado y devuelve a dónde ir a pagar. */
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta para comprar el pase.' }, { status: 401 })
  // Sin la tabla de pases no se podría registrar el pago: mejor no cobrar.
  if (!(await passesReady())) return NextResponse.json({ error: 'Los pagos todavía no están habilitados. Probá más tarde.' }, { status: 503 })
  try {
    return NextResponse.json({ url: await createPass(user.id, user.email, siteUrl()) })
  } catch (e) {
    return NextResponse.json({ error: 'Mercado Pago no pudo crear el pago: ' + (e as Error).message }, { status: 502 })
  }
}
