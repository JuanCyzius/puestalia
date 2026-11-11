import { NextResponse } from 'next/server'
import { adminToken, checkPassword } from '@/lib/auth'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}))
  if (typeof password !== 'string' || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)) // frena intentos repetidos
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('adm', adminToken(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return res
}
