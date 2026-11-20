import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { approveHire, listHires } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await listHires().catch(() => []))
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id, approved } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  await approveHire(id, !!approved)
  return NextResponse.json({ ok: true })
}
