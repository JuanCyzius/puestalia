import { NextResponse } from 'next/server'
import { addHire } from '@/lib/db'
import { getUser } from '@/lib/session'

/** "Conseguí trabajo": guarda la historia. Solo se publica si la persona lo autoriza y el admin la aprueba. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}))
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = s(b.name, 80), role = s(b.role, 120), company = s(b.company, 120), testimonial = s(b.testimonial, 600)
  if (name.length < 2 || role.length < 2) return NextResponse.json({ error: 'Completá tu nombre y el puesto.' }, { status: 400 })
  try {
    await addHire({ user_id: (await getUser())?.id ?? null, name, role, company: company || null, testimonial: testimonial || null, can_publish: !!b.can_publish })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo guardar: ' + (e as Error).message }, { status: 500 })
  }
}
