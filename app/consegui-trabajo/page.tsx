import type { Metadata } from 'next'
import { HireForm } from './form'

export const metadata: Metadata = { title: '¿Conseguiste trabajo? Contanos', alternates: { canonical: '/consegui-trabajo' } }

export default function Consegui() {
  return (
    <div className="page">
      <p className="kicker">Historias</p>
      <h1>¿Conseguiste trabajo con un aviso de Puestalia?</h1>
      <p className="lead">¡Felicitaciones! Contanos en dos minutos. Nos ayuda a saber qué funciona y, si nos autorizás, tu historia le da ánimo a quien sigue buscando.</p>
      <HireForm />
    </div>
  )
}
