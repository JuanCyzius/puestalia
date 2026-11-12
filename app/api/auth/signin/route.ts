import { NextResponse } from 'next/server'
import { loginUser } from '@/lib/db'
import { setSession, validEmail } from '@/lib/session'

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!validEmail(email) || typeof password !== 'string') return NextResponse.json({ error: 'Completá mail y contraseña.' }, { status: 400 })
  const user = await loginUser(email.trim().toLowerCase(), password).catch(() => null)
  if (!user) {
    await new Promise((r) => setTimeout(r, 600)) // frena intentos repetidos
    return NextResponse.json({ error: 'Mail o contraseña incorrectos.' }, { status: 401 })
  }
  return setSession(NextResponse.json({ ok: true }), user)
}
