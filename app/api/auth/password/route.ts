import { NextResponse } from 'next/server'
import { setPassword } from '@/lib/db'
import { getUser, validPassword } from '@/lib/session'

/** Cambia la contraseña del usuario logueado. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta.' }, { status: 401 })
  const { password } = await req.json().catch(() => ({}))
  if (!validPassword(password)) return NextResponse.json({ error: 'La contraseña tiene que tener al menos 8 caracteres.' }, { status: 400 })
  try {
    await setPassword(user.id, password)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo cambiar: ' + (e as Error).message }, { status: 500 })
  }
}
