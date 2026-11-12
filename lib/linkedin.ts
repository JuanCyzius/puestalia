import { CATEGORIES, EXPERIENCES, MODALITIES, type Job } from './types'

type J = Pick<Job, 'id' | 'title' | 'company' | 'description' | 'requirements' | 'experience' | 'location' | 'modality' | 'schedule_type' | 'hours' | 'salary' | 'category' | 'contact_email'>

const cut = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)).replace(/[,;:.]$/, '') + '…')
const tag = (t: string) => '#' + t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '')

/** Texto listo para pegar en LinkedIn: título, datos clave, tareas, requisitos y enlace a la ficha. */
export function linkedinPost(j: J, site: string) {
  const facts = [
    [j.location, j.modality && MODALITIES[j.modality]].filter(Boolean).join(' · ') && '📍 ' + [j.location, j.modality && MODALITIES[j.modality]].filter(Boolean).join(' · '),
    [j.schedule_type, j.hours].filter(Boolean).join(' · ') && '🕒 ' + [j.schedule_type, j.hours].filter(Boolean).join(' · '),
    j.salary && '💰 ' + j.salary,
    j.experience && '🎓 ' + (j.experience === 'sin_experiencia' ? 'No hace falta experiencia' : 'Nivel ' + EXPERIENCES[j.experience].toLowerCase()),
    j.contact_email && '✉️ Postulación por mail directo',
  ].filter(Boolean)
  const reqs = (j.requirements ?? '').split(/\n|;|(?<=\.)\s+/).map((r) => r.replace(/^[-•*\s]+/, '').trim()).filter((r) => r.length > 3).slice(0, 4)
  const tags = ['empleo', 'trabajo', CATEGORIES[j.category] ?? '', j.modality === 'remoto' ? 'trabajoremoto' : '', j.experience === 'sin_experiencia' ? 'sinexperiencia' : '', 'Argentina']
    .filter(Boolean).map(tag)
  return [
    `🔎 BÚSQUEDA ABIERTA: ${j.title}${j.company ? ' · ' + j.company : ''}`,
    '',
    ...facts,
    '',
    'Qué vas a hacer',
    cut(j.description.replace(/\s+/g, ' ').trim(), 320),
    ...(reqs.length ? ['', 'Qué piden', ...reqs.map((r) => '▪️ ' + cut(r, 110))] : []),
    '',
    `👉 Ficha completa y cómo postularte: ${site}/empleos/${j.id}`,
    '',
    'Publicamos avisos nuevos todos los días. Seguinos para no perderte ninguno.',
    '',
    [...new Set(tags)].join(' '),
  ].join('\n')
}
