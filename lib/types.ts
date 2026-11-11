export type Modality = 'remoto' | 'hibrido' | 'presencial'
export type Experience = 'sin_experiencia' | 'junior' | 'semi_senior' | 'senior'

/** Lo que devuelve la IA y lo que se edita en el panel. Todo lo que el aviso no informa queda en null. */
export type JobDraft = {
  title: string
  company: string | null
  description: string
  requirements: string | null
  experience: Experience | null
  education: string | null
  location: string | null
  modality: Modality | null
  schedule_type: string | null
  hours: string | null
  salary: string | null
  benefits: string | null
  contact_email: string | null
  apply_url: string | null
  category: string
  source: string | null
  /** Fecha en que la empresa publicó el aviso (AAAA-MM-DD). No es la fecha en que se sube a Puestalia. */
  source_published_at: string | null
  /** Fecha de cierre informada por la fuente, si existe (AAAA-MM-DD). */
  closing_date: string | null
}

export type Job = JobDraft & {
  id: string
  published_at: string
  expires_at: string
  status: 'active' | 'expired'
  fingerprint: string
}

export type Filters = { q?: string; cat?: string; mod?: string; exp?: string; jor?: string }

export const CATEGORIES: Record<string, string> = {
  administracion: 'Administración',
  'atencion-al-cliente': 'Atención al cliente',
  ventas: 'Ventas',
  marketing: 'Marketing',
  tecnologia: 'Tecnología',
  logistica: 'Logística',
  rrhh: 'Recursos humanos',
  otros: 'Otros',
}
export const MODALITIES: Record<Modality, string> = { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' }
export const EXPERIENCES: Record<Experience, string> = {
  sin_experiencia: 'Sin experiencia',
  junior: 'Junior',
  semi_senior: 'Semi senior',
  senior: 'Senior',
}
export const SCHEDULES = ['Tiempo completo', 'Medio tiempo', 'Por turnos', 'Freelance', 'Pasantía']

export const FREE_PER_DAY = 8
export const DAYS_LIVE = 30
