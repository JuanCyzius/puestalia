import type { Filters } from './types'

/** Páginas por tema: lo que la gente escribe en Google, con el buscador ya filtrado. */
export const LANDINGS: Record<string, { filters: Filters; h1: string; title: string; description: string; intro: string }> = {
  'trabajo-remoto': {
    filters: { mod: 'remoto' },
    h1: 'Trabajo remoto en Argentina',
    title: 'Trabajo remoto en Argentina: ofertas home office vigentes',
    description: 'Ofertas de trabajo remoto y home office en Argentina, revisadas y vigentes. Filtrá por rubro y experiencia y postulate por mail directo.',
    intro: 'Ofertas de trabajo 100% remoto publicadas por empresas y consultoras de Argentina. Cada aviso se revisa antes de salir, muestra horario y requisitos en el mismo orden y se baja solo cuando vence.',
  },
  'empleos-sin-experiencia': {
    filters: { exp: 'sin_experiencia' },
    h1: 'Empleos sin experiencia en Argentina',
    title: 'Empleos sin experiencia: primer trabajo en Argentina',
    description: 'Ofertas de empleo sin experiencia previa en Argentina: primer trabajo, atención al cliente, administración y más. Avisos vigentes y revisados.',
    intro: 'Avisos para tu primer trabajo o para cambiar de rubro: puestos donde la empresa aclara que no pide experiencia previa. Filtrá por modalidad y rubro, y si el aviso tiene mail directo, te postulás en un toque.',
  },
  'empleos-administrativos': {
    filters: { cat: 'administracion' },
    h1: 'Empleos administrativos en Argentina',
    title: 'Empleos administrativos: ofertas de administración vigentes',
    description: 'Ofertas de empleo administrativo en Argentina: asistente, data entry, recepción, facturación. Remotas, híbridas y presenciales, revisadas y vigentes.',
    intro: 'Puestos de administración: asistentes, data entry, recepción, facturación, cuentas a pagar y más. Remotos, híbridos o presenciales, con los datos clave a la vista y la vigencia de cada aviso.',
  },
}
