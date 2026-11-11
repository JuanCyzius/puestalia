'use client'
import { useState } from 'react'

export function Apply({ title, email, url }: { title: string; email: string | null; url: string | null }) {
  const [copied, setCopied] = useState(false)
  const subject = `Postulación - ${title}`
  const body = `Hola, buen día.\n\nMe comunico para postularme a la posición de ${title}.\n\nAdjunto mi CV para que puedan evaluar mi perfil.\n\nMuchas gracias por su tiempo.\n\nSaludos.`
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null
  return (
    <>
      <div className="apply">
        {mailto && <a className="btn" href={mailto}>Postularme por mail</a>}
        {email && (
          <button className="btn ghost" onClick={async () => { await navigator.clipboard.writeText(email); setCopied(true) }}>
            {copied ? 'Mail copiado' : 'Copiar mail'}
          </button>
        )}
        {url && <a className={mailto ? 'btn ghost' : 'btn'} href={url} target="_blank" rel="noopener nofollow">{mailto ? 'Ver aviso original' : 'Postularme en el sitio'}</a>}
      </div>
      {mailto && <p className="note">Se abre tu correo con destinatario ({email}), asunto y mensaje listos. Acordate de adjuntar tu CV antes de enviar.</p>}
    </>
  )
}
