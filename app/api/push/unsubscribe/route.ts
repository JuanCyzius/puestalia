import { NextResponse } from 'next/server'
import { deletePushSub } from '@/lib/db'
import { getUser } from '@/lib/session'

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta.' }, { status: 401 })
  const { endpoint } = await req.json().catch(() => ({}))
  if (typeof endpoint === 'string') await deletePushSub(endpoint, user.id)
  return NextResponse.json({ ok: true })
}
