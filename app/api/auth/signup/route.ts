import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/db'
import { setSession, validEmail, validPassword } from '@/lib/session'

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}))
  if (!validEmail(email)) return NextResponse.json({ error: 'Revisá el mail.' }, { status: 400 })
  if (!validPassword(password)) return NextResponse.json({ error: 'La contraseña tiene que tener al menos 8 caracteres.' }, { status: 400 })
  try {
    const user = await registerUser(email.trim().toLowerCase(), password, typeof name === 'string' ? name.trim().slice(0, 80) : undefined)
    if (!user) return NextResponse.json({ error: 'Ya hay una cuenta con ese mail. Ingresá con tu contraseña.' }, { status: 409 })
    return setSession(NextResponse.json({ ok: true }), user)
  } catch (e) {
    return NextResponse.json({ error: 'No pudimos crear la cuenta. ' + (e as Error).message }, { status: 500 })
  }
}
