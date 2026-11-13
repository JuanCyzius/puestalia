import { NextResponse } from 'next/server'
import { ping } from '@/lib/db'
import { getUser } from '@/lib/session'

/** Latido de cada pestaña abierta (una vez por minuto). Solo guarda un id anónimo, la página y la hora. */
export async function POST(req: Request) {
  const { v, p } = await req.json().catch(() => ({}))
  if (typeof v !== 'string' || !/^[a-f0-9-]{16,64}$/i.test(v)) return new NextResponse(null, { status: 204 })
  await ping(v, typeof p === 'string' && p.startsWith('/') ? p : '/', (await getUser())?.id ?? null).catch(() => {})
  return new NextResponse(null, { status: 204 })
}
