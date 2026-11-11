# Puestalia · etapa 1

Web de avisos de empleo (remoto, sin experiencia, administración) con 8 avisos gratis por día, el resto bloqueado para Premium, panel de carga asistida por IA y vencimiento automático a 30 días.

## Probarla en tu máquina (modo demo, sin cuentas)

```bash
npm install
cp .env.example .env.local   # poné al menos ADMIN_PASSWORD
npm run dev                   # http://localhost:3000
```

Sin `SUPABASE_*` corre con 12 avisos ficticios en memoria. El panel está en `/admin`.

## Ponerla en producción

1. **Supabase:** creá un proyecto, abrí SQL Editor y pegá `supabase/schema.sql` completo. Copiá la URL del proyecto y la clave `service_role` (Settings > API). Esa clave es secreta: va solo en variables de entorno del servidor.
2. **Anthropic:** creá una clave en console.anthropic.com y cargá unos dólares de crédito.
3. **Vercel:** importá el repositorio y cargá las variables de `.env.example`. Para cobrar necesitás el plan Pro.
4. **Dominio:** apuntalo a Vercel y poné `NEXT_PUBLIC_SITE_URL` con la dirección final.

## Qué hay

| Ruta | Qué hace |
| --- | --- |
| `/` | Portada, buscador, filtros y tarjetas. Los 8 avisos más recientes se abren gratis; el resto lleva a Premium |
| `/empleos/[id]` | Ficha completa, botón de postulación por mail con asunto y mensaje armados, datos estructurados para Google |
| `/premium` | Lista de espera con el precio (hasta conectar Mercado Pago en la etapa 2) |
| `/admin` | Pegás texto, captura, PDF o enlace → la IA arma la ficha → revisás → publicás |
| `POST /api/ingest` | Devuelve la ficha en borrador. Acepta la cookie del panel o `Authorization: Bearer INGEST_TOKEN` |
| `POST /api/jobs` | Publica un borrador revisado; rechaza duplicados (409) salvo `force` |

## Reglas que ya cumple

- **No inventa:** la IA devuelve vacío lo que el aviso no dice y la ficha muestra "No informado".
- **Vencimiento exacto:** `expires_at` = publicación + 30 días, o la fecha de cierre si es anterior. Todas las consultas filtran por esa fecha, así el aviso desaparece a la hora exacta. La limpieza diaria (pg_cron, 03:00 de Argentina) marca vencidos y a los 60 días los borra dejando una fila en `job_stats`.
- **Dos fechas:** `source_published_at` (la empresa) y `published_at` (Puestalia).
- **Duplicados:** huella de empresa + puesto + ubicación.
- **LinkedIn e Instagram:** el panel rechaza sus enlaces; para esos avisos se pega el texto o una captura.

## Pendiente

- Etapa 1: conector MCP para publicar desde Claude, verificación periódica de enlaces, botón "Reportar aviso".
- Etapa 2: registro, Mercado Pago, acceso Premium real (hoy nadie puede abrir los avisos bloqueados).
- Etapa 3: CV, envío con adjunto, historial.
