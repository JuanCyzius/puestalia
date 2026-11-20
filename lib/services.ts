/** Servicios pagos (además del pase Premium). Precios en pesos, pago único con Mercado Pago. */
export type ServiceId = 'cv-express' | 'cv-pro' | 'acompanamiento'

export const SERVICES: Record<ServiceId, {
  name: string; price: number; tagline: string; delivery: string; includes: string[]; pass?: boolean; featured?: boolean
}> = {
  'cv-express': {
    name: 'CV Express',
    price: 9900,
    tagline: 'Tu CV reescrito para que se entienda en 10 segundos.',
    delivery: 'Entrega en 48 h hábiles',
    includes: [
      'Revisión y reescritura completa de tu CV',
      'Formato de una página, claro y legible por los sistemas de selección (ATS)',
      'Logros y tareas redactados con verbos concretos',
      'Una ronda de cambios',
      'Entrega en PDF y en Word',
    ],
  },
  'cv-pro': {
    name: 'CV Pro',
    price: 19900,
    tagline: 'CV, carta de presentación y LinkedIn alineados al puesto que buscás.',
    delivery: 'Entrega en 72 h hábiles',
    featured: true,
    includes: [
      'Todo lo del CV Express',
      'Carta o mail de presentación adaptado a un puesto',
      'Titular y "Acerca de" de LinkedIn reescritos',
      'Palabras clave del rubro para aparecer en búsquedas',
      'Dos rondas de cambios',
    ],
  },
  acompanamiento: {
    name: 'Acompañamiento 30 días',
    price: 24900,
    tagline: 'Un mes con nosotros para ordenar tu búsqueda y postularte mejor.',
    delivery: 'Arranca dentro de las 48 h hábiles',
    pass: true,
    includes: [
      'Premium por 30 días incluido: ves cada oferta apenas entra',
      'CV Express incluido',
      'Un plan de búsqueda según el puesto que querés',
      'Tips semanales por mail o WhatsApp durante 4 semanas',
      'Revisión de hasta 5 mails de postulación antes de mandarlos',
      'Simulacro de entrevista por escrito con devolución',
    ],
  },
}

export const isService = (s: unknown): s is ServiceId => typeof s === 'string' && s in SERVICES
export const money = (n: number) => '$' + n.toLocaleString('es-AR')
