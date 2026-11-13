import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { adminStats } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try { return NextResponse.json((await adminStats()) ?? { error: 'Sin base de datos (modo demo).' }) }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }) }
}
