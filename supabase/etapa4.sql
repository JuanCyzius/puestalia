-- Puestalia · etapa 4: servicios (CV y acompañamiento) y "conseguí trabajo" (pegar en Supabase > SQL Editor y ejecutar; se puede correr más de una vez)

-- Pedidos de servicios pagos.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  product text not null,                 -- cv-express | cv-pro | acompanamiento
  price numeric not null,
  target text,                           -- puesto que busca
  notes text,
  cv_path text,                          -- archivo en el bucket privado "cvs"
  status text not null default 'pending',-- pending | paid | in_progress | delivered | cancelled
  mp_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  delivered_at timestamptz
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);
alter table orders enable row level security;

-- Personas que cuentan que consiguieron trabajo (el contador de la web usa solo estos datos reales).
create table if not exists hires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null,
  company text,
  testimonial text,
  can_publish boolean not null default false, -- la persona autorizó mostrar su testimonio
  approved boolean not null default false,    -- vos lo revisaste en el panel
  created_at timestamptz not null default now()
);
alter table hires enable row level security;

-- Carpeta privada para los CV que suben con los pedidos (solo el servidor accede).
insert into storage.buckets (id, name, public, file_size_limit)
values ('cvs', 'cvs', false, 5242880)
on conflict (id) do nothing;
