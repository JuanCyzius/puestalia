import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { cronOk, runPush } from '@/lib/push'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

/** Envío de notificaciones. Lo llama la tarea programada de Netlify cada 15 minutos (o el admin a mano). */
async function run(req: Request) {
  if (!cronOk(req) && !(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    return NextResponse.json(await runPush())
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
export const POST = run
export const GET = run
