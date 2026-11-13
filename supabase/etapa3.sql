-- Puestalia · etapa 3: pase de 30 días, avisos gratis con 72 h de retraso, notificaciones y visitas en vivo (pegar en Supabase > SQL Editor y ejecutar; se puede correr más de una vez)
-- Cada pago aprobado de Mercado Pago suma 30 días. No hay débito automático.
create table if not exists passes (
  mp_payment_id text primary key,            -- id del pago en Mercado Pago (evita sumar dos veces el mismo pago)
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,                      -- pending | in_process | approved | rejected | cancelled | refunded | charged_back
  amount numeric,
  starts_at timestamptz,                     -- se completan cuando el pago se aprueba
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists passes_user_idx on passes (user_id, ends_at desc);
-- Solo el servidor lee y escribe.
alter table passes enable row level security;

-- Avisos compartidos en LinkedIn: quedan abiertos gratis desde el principio (el resto, 72 h después).
alter table jobs add column if not exists open_free boolean not null default false;

-- Notificaciones al celular: un registro por navegador/celular, con lo que la persona quiere recibir.
create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  cats text[] not null default '{}',   -- rubros (vacío = todos)
  mods text[] not null default '{}',   -- modalidades (vacío = todas)
  exps text[] not null default '{}',   -- experiencia (vacío = toda)
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;

-- Visitas en vivo para el panel de admin: un registro anónimo por navegador, con la última vez que se lo vio.
create table if not exists presence (
  visitor_id text primary key,
  user_id uuid,
  path text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists presence_seen_idx on presence (last_seen desc);
alter table presence enable row level security;
-- Borra visitas de más de 30 días todas las mañanas (pg_cron ya está activo desde la etapa 1).
select cron.schedule('presence-cleanup', '15 6 * * *', $$delete from presence where last_seen < now() - interval '30 days'$$);
