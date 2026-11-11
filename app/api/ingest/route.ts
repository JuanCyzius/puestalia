import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { extractJob } from '@/lib/extract'

export const maxDuration = 60
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

/** Recibe texto, enlace o archivo y devuelve la ficha en borrador. No publica nada. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b || (!b.text && !b.url && !b.file)) return NextResponse.json({ error: 'Mandá texto, un enlace o un archivo.' }, { status: 400 })
  if (b.file && !TYPES.includes(b.file.media_type)) return NextResponse.json({ error: 'Formato no soportado. Usá PNG, JPG, WEBP o PDF.' }, { status: 400 })
  try {
    return NextResponse.json({ draft: await extractJob(b) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }
}
