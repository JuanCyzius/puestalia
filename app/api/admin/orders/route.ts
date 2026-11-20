import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { cvUrl, listOrders, setOrderStatus } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const orders = await listOrders().catch(() => [])
  return NextResponse.json(await Promise.all(orders.map(async (o) => ({ ...o, cv_url: o.cv_path ? await cvUrl(o.cv_path) : null }))))
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id, status } = await req.json().catch(() => ({}))
  if (typeof id !== 'string' || !['in_progress', 'delivered', 'cancelled'].includes(status)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  await setOrderStatus(id, status)
  return NextResponse.json({ ok: true })
}
