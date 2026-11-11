import { CATEGORIES, SCHEDULES, type JobDraft } from './types'

type Input = { text?: string; url?: string; file?: { data: string; media_type: string } }

const str = (description: string) => ({ type: ['string', 'null'], description })
const schema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Nombre del puesto' },
    company: str('Empresa que busca. null si es confidencial o no figura'),
    description: { type: 'string', description: 'Descripción del puesto y tareas, redactada con palabras propias, sin copiar párrafos enteros. Sin datos que no estén en el aviso.' },
    requirements: str('Requisitos, uno por línea'),
    experience: { type: ['string', 'null'], enum: ['sin_experiencia', 'junior', 'semi_senior', 'senior', null], description: 'Solo si el aviso lo dice' },
    education: str('Nivel de estudios pedido'),
    location: str('Ciudad y provincia'),
    modality: { type: ['string', 'null'], enum: ['remoto', 'hibrido', 'presencial', null] },
    schedule_type: { type: ['string', 'null'], enum: [...SCHEDULES, null] },
    hours: str('Horarios tal como figuran'),
    salary: str('Salario tal como figura. null si no está publicado'),
    benefits: str('Beneficios'),
    contact_email: str('Email que el aviso ofrece para postularse'),
    apply_url: str('Enlace de postulación o del aviso original'),
    category: { type: 'string', enum: Object.keys(CATEGORIES) },
    source: str('Dónde se publicó el aviso: LinkedIn, sitio de la empresa, etc.'),
    source_published_at: str('Fecha en que la empresa publicó el aviso, AAAA-MM-DD. null si no se puede saber con certeza'),
    closing_date: str('Fecha de cierre de la búsqueda, AAAA-MM-DD, solo si el aviso la informa'),
  },
  required: ['title', 'description', 'category'],
}

const SYSTEM = `Sos el asistente de carga de Puestalia, un sitio argentino de avisos de empleo.
Recibís un aviso (texto, captura o PDF) y lo convertís en una ficha estructurada.
Reglas:
- No inventes nada. Si un dato no figura en el aviso, devolvé null. Nunca estimes salario, horarios, requisitos ni fechas.
- Escribí en español rioplatense neutro, claro y sin adjetivos de venta.
- No incluyas nombres, teléfonos ni perfiles de personas. Solo el email que el aviso ofrece para postularse.
- Si el contenido no es un aviso de empleo, devolvé title "NO ES UN AVISO".
Hoy es ${new Date().toISOString().slice(0, 10)}.`

async function readUrl(url: string) {
  const u = new URL(url)
  if (!/^https?:$/.test(u.protocol)) throw new Error('Enlace inválido')
  if (/(^|\.)linkedin\.com$|(^|\.)instagram\.com$/.test(u.hostname))
    throw new Error('LinkedIn e Instagram no permiten lectura automática. Pegá el texto o subí una captura.')
  const r = await fetch(u, { headers: { 'user-agent': 'PuestaliaBot/1.0 (+carga manual de un aviso)' }, signal: AbortSignal.timeout(15000) })
  if (!r.ok) throw new Error('No pude abrir el enlace (' + r.status + '). Pegá el texto del aviso.')
  const html = await r.text()
  return html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 20000)
}

export async function extractJob(input: Input): Promise<JobDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY en las variables de entorno.')
  const content: unknown[] = []
  if (input.file) {
    const pdf = input.file.media_type === 'application/pdf'
    content.push({ type: pdf ? 'document' : 'image', source: { type: 'base64', media_type: input.file.media_type, data: input.file.data } })
  }
  let text = input.text?.trim() ?? ''
  if (input.url) text += `\n\nContenido de ${input.url}:\n` + (await readUrl(input.url))
  content.push({ type: 'text', text: text || 'Extraé el aviso del archivo adjunto.' })

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 2000,
      system: SYSTEM,
      tools: [{ name: 'guardar_aviso', description: 'Guarda la ficha del aviso', input_schema: schema }],
      tool_choice: { type: 'tool', name: 'guardar_aviso' },
      messages: [{ role: 'user', content }],
    }),
  })
  if (!r.ok) throw new Error('Error de la API de Claude: ' + (await r.text()).slice(0, 300))
  const out = await r.json()
  const d = out.content?.find((c: { type: string }) => c.type === 'tool_use')?.input
  if (!d) throw new Error('La IA no devolvió una ficha.')
  if (d.title === 'NO ES UN AVISO') throw new Error('Eso no parece un aviso de empleo.')
  const n = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return {
    title: String(d.title), company: n(d.company), description: String(d.description ?? ''), requirements: n(d.requirements),
    experience: n(d.experience) as JobDraft['experience'], education: n(d.education), location: n(d.location),
    modality: n(d.modality) as JobDraft['modality'], schedule_type: n(d.schedule_type), hours: n(d.hours), salary: n(d.salary),
    benefits: n(d.benefits), contact_email: n(d.contact_email), apply_url: n(d.apply_url) ?? input.url ?? null,
    category: CATEGORIES[d.category] ? d.category : 'otros', source: n(d.source),
    source_published_at: n(d.source_published_at), closing_date: n(d.closing_date),
  }
}
