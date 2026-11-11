import type { Job, JobDraft } from './types'

/** Avisos FICTICIOS para ver la web sin base de datos. No se usan cuando Supabase está configurado. */
const base: Partial<JobDraft>[] = [
  { title: 'Asistente administrativo', category: 'administracion', modality: 'hibrido', experience: 'sin_experiencia', location: 'Lanús, Buenos Aires', schedule_type: 'Tiempo completo', hours: 'Lunes a viernes de 9 a 18', salary: '$950.000 brutos', contact_email: 'rrhh@ejemplo.com.ar' },
  { title: 'Atención al cliente por chat', category: 'atencion-al-cliente', modality: 'remoto', experience: 'sin_experiencia', location: 'Argentina', schedule_type: 'Medio tiempo', hours: 'Turno tarde', contact_email: 'seleccion@ejemplo.com.ar' },
  { title: 'Analista de cuentas a pagar', category: 'administracion', modality: 'presencial', experience: 'junior', location: 'CABA', schedule_type: 'Tiempo completo', apply_url: 'https://example.com/empleo/1' },
  { title: 'Data entry', category: 'administracion', modality: 'remoto', experience: 'sin_experiencia', location: 'Argentina', schedule_type: 'Medio tiempo', salary: '$520.000', contact_email: 'empleos@ejemplo.com.ar' },
  { title: 'Asistente de marketing', category: 'marketing', modality: 'hibrido', experience: 'junior', location: 'Avellaneda, Buenos Aires', schedule_type: 'Tiempo completo', contact_email: 'talento@ejemplo.com.ar' },
  { title: 'Recepcionista', category: 'administracion', modality: 'presencial', experience: 'sin_experiencia', location: 'Lomas de Zamora, Buenos Aires', schedule_type: 'Tiempo completo', hours: 'Lunes a viernes de 8 a 17', contact_email: 'rrhh@ejemplo.com.ar' },
  { title: 'Soporte técnico nivel 1', category: 'tecnologia', modality: 'remoto', experience: 'junior', location: 'Argentina', schedule_type: 'Por turnos', apply_url: 'https://example.com/empleo/2' },
  { title: 'Vendedor/a telefónico', category: 'ventas', modality: 'remoto', experience: 'sin_experiencia', location: 'Argentina', schedule_type: 'Medio tiempo', benefits: 'Comisiones y capacitación paga', contact_email: 'ventas@ejemplo.com.ar' },
  { title: 'Administrativo/a de facturación', category: 'administracion', modality: 'presencial', experience: 'junior', location: 'Quilmes, Buenos Aires', schedule_type: 'Tiempo completo', contact_email: 'administracion@ejemplo.com.ar' },
  { title: 'Asistente de recursos humanos', category: 'rrhh', modality: 'hibrido', experience: 'sin_experiencia', location: 'CABA', schedule_type: 'Pasantía', contact_email: 'rrhh@ejemplo.com.ar' },
  { title: 'Operador/a de logística', category: 'logistica', modality: 'presencial', experience: 'sin_experiencia', location: 'Avellaneda, Buenos Aires', schedule_type: 'Por turnos', apply_url: 'https://example.com/empleo/3' },
  { title: 'Analista de datos junior', category: 'tecnologia', modality: 'remoto', experience: 'junior', location: 'Argentina', schedule_type: 'Tiempo completo', salary: 'USD 900', apply_url: 'https://example.com/empleo/4' },
]

export function seedJobs(): Job[] {
  const now = Date.now()
  return base.map((b, i) => {
    const published = new Date(now - i * 5 * 3600000)
    return {
      id: 'demo-' + (i + 1),
      title: b.title!,
      company: 'Empresa de ejemplo ' + (i + 1),
      description: 'Aviso ficticio para mostrar cómo se ve una publicación. Tareas del puesto, equipo de trabajo y condiciones se describen acá, con las palabras del aviso original.',
      requirements: 'Secundario completo. Manejo de herramientas de oficina. Buena comunicación.',
      experience: b.experience ?? null,
      education: 'Secundario completo',
      location: b.location ?? null,
      modality: b.modality ?? null,
      schedule_type: b.schedule_type ?? null,
      hours: b.hours ?? null,
      salary: b.salary ?? null,
      benefits: b.benefits ?? null,
      contact_email: b.contact_email ?? null,
      apply_url: b.apply_url ?? null,
      category: b.category!,
      source: 'Demo',
      source_published_at: published.toISOString().slice(0, 10),
      closing_date: null,
      published_at: published.toISOString(),
      expires_at: new Date(published.getTime() + 30 * 86400000).toISOString(),
      status: 'active',
      fingerprint: 'demo|' + i,
    }
  })
}
