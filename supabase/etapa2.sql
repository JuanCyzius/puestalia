-- Puestalia · etapa 2: suscripciones (pegar en Supabase > SQL Editor y ejecutar)
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mp_preapproval_id text,
  status text not null default 'pending',   -- pending | authorized | paused | cancelled (lo informa Mercado Pago)
  payer_email text,
  next_payment_date timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_mp_idx on subscriptions (mp_preapproval_id);
-- Solo el servidor lee y escribe.
alter table subscriptions enable row level security;
