import { NextResponse } from 'next/server'
import { addWaitlist } from '@/lib/db'

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Mail inválido' }, { status: 400 })
  await addWaitlist(email.toLowerCase().trim())
  return NextResponse.json({ ok: true })
}
