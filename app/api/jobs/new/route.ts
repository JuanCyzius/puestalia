import { NextResponse } from 'next/server'
import { isPremium, listJobs } from '@/lib/db'
import { getUser } from '@/lib/session'
import { freeAt } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * ¿Entraron avisos nuevos desde `since`? Lo consulta la pestaña abierta cada 2 minutos.
 * Premium: avisos publicados. Gratis: avisos que se liberaron gratis.
 */
export async function GET(req: Request) {
  const now = Date.now()
  const since = Date.parse(new URL(req.url).searchParams.get('since') ?? '')
  if (!since) return NextResponse.json({ now: new Date(now).toISOString(), count: 0 })
  const premium = await isPremium((await getUser())?.id)
  const fresh = (await listJobs())
    .map((j) => ({ j, t: (premium ? new Date(j.published_at) : freeAt(j)).getTime() }))
    .filter(({ t }) => t > since && t <= now)
    .sort((a, b) => b.t - a.t)
  return NextResponse.json({
    now: new Date(now).toISOString(),
    count: fresh.length,
    first: fresh[0] ? { id: fresh[0].j.id, title: fresh[0].j.title } : null,
  })
}
