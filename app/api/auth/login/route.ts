import { NextResponse } from 'next/server'
import { sendLoginLink } from '@/lib/db'
import { safeNext, siteUrl } from '@/lib/session'

export async function POST(req: Request) {
  const { email, next } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Revisá el mail.' }, { status: 400 })
  try {
    await sendLoginLink(email.trim().toLowerCase(), `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const m = (e as Error).message
    return NextResponse.json({ error: /rate|limit/i.test(m) ? 'Se enviaron demasiados mails seguidos. Esperá unos minutos y probá de nuevo.' : 'No pudimos enviar el mail. ' + m }, { status: 500 })
  }
}
