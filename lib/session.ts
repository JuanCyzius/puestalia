import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

export type User = { id: string; email: string }
const secret = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sign = (p: string) => createHmac('sha256', secret()).update(p).digest('base64url')
export const SESSION_DAYS = 30

/** Sesión propia del sitio: id y mail del usuario, firmados. No guarda tokens de Supabase. */
export function makeToken(u: User) {
  const p = Buffer.from(JSON.stringify({ id: u.id, email: u.email, exp: Date.now() + SESSION_DAYS * 86400000 })).toString('base64url')
  return p + '.' + sign(p)
}

export async function getUser(): Promise<User | null> {
  if (!secret()) return null
  const t = (await cookies()).get('ses')?.value
  if (!t) return null
  const [p, s] = t.split('.')
  if (!p || !s) return null
  const e = sign(p)
  if (e.length !== s.length || !timingSafeEqual(Buffer.from(e), Buffer.from(s))) return null
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString())
    return d.exp > Date.now() && d.id && d.email ? { id: d.id, email: d.email } : null
  } catch { return null }
}

/** Solo rutas internas, para que el "volver a" no pueda mandar a otro sitio. */
export const safeNext = (n: unknown) => (typeof n === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(n) ? n : '/cuenta')
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export function setSession(res: NextResponse, user: User) {
  res.cookies.set('ses', makeToken(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400 })
  return res
}
export const validEmail = (e: unknown): e is string => typeof e === 'string' && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const validPassword = (p: unknown): p is string => typeof p === 'string' && p.length >= 8 && p.length <= 200
