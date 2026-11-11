import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { createJob, DuplicateError, listJobs } from '@/lib/db'
import { CATEGORIES, type JobDraft } from '@/lib/types'

const KEYS: (keyof JobDraft)[] = ['title', 'company', 'description', 'requirements', 'experience', 'education', 'location', 'modality',
  'schedule_type', 'hours', 'salary', 'benefits', 'contact_email', 'apply_url', 'category', 'source', 'source_published_at', 'closing_date']
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Publica un aviso ya revisado. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { draft, force } = await req.json().catch(() => ({}))
  if (!draft?.title?.trim() || !draft?.description?.trim()) return NextResponse.json({ error: 'Faltan el puesto o la descripción.' }, { status: 400 })
  const d = Object.fromEntries(KEYS.map((k) => [k, typeof draft[k] === 'string' && draft[k].trim() ? draft[k].trim() : null])) as unknown as JobDraft
  if (!CATEGORIES[d.category]) d.category = 'otros'
  for (const k of ['source_published_at', 'closing_date'] as const) if (d[k] && !DATE.test(d[k]!)) return NextResponse.json({ error: `La fecha "${d[k]}" debe ser AAAA-MM-DD.` }, { status: 400 })
  if (d.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact_email)) return NextResponse.json({ error: 'El mail de postulación no es válido.' }, { status: 400 })
  if (d.apply_url && !/^https?:\/\//.test(d.apply_url)) return NextResponse.json({ error: 'El enlace debe empezar con http.' }, { status: 400 })
  try {
    return NextResponse.json({ job: await createJob(d, !!force) })
  } catch (e) {
    if (e instanceof DuplicateError) return NextResponse.json({ error: 'Ya hay un aviso vigente con la misma empresa, puesto y ubicación.' }, { status: 409 })
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/** Últimos avisos publicados, para el panel. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ jobs: (await listJobs()).slice(0, 12) })
}
