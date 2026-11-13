-- Puestalia · etapa 3: pase Premium de 30 días con pago único (pegar en Supabase > SQL Editor y ejecutar)
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
