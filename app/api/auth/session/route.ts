import { NextResponse } from 'next/server'
import { userFromAccessToken } from '@/lib/db'
import { makeToken, SESSION_DAYS } from '@/lib/session'

/** Cambia el token del enlace del mail por la sesión del sitio. */
export async function POST(req: Request) {
  const { access_token } = await req.json().catch(() => ({}))
  const user = typeof access_token === 'string' ? await userFromAccessToken(access_token) : null
  if (!user) return NextResponse.json({ error: 'El enlace venció o ya se usó. Pedí uno nuevo.' }, { status: 401 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('ses', makeToken(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400 })
  return res
}
