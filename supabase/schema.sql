-- Puestalia · esquema de base (pegar completo en Supabase > SQL Editor)
create extension if not exists pg_trgm;
create extension if not exists pg_cron;

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  description text not null default '',
  requirements text,
  experience text check (experience in ('sin_experiencia','junior','semi_senior','senior')),
  education text,
  location text,
  modality text check (modality in ('remoto','hibrido','presencial')),
  schedule_type text,
  hours text,
  salary text,
  benefits text,
  contact_email text,
  apply_url text,
  category text not null default 'otros',
  source text,
  source_published_at date,          -- cuándo lo publicó la empresa
  closing_date date,                 -- cierre informado por la fuente
  published_at timestamptz not null default now(),  -- cuándo se subió a Puestalia
  expires_at timestamptz not null,   -- publicación + 30 días, o antes si hay cierre
  status text not null default 'active' check (status in ('active','expired')),
  fingerprint text not null,
  views int not null default 0,
  fts tsvector generated always as (
    to_tsvector('spanish',
      coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(description,'') || ' ' ||
      coalesce(requirements,'') || ' ' || coalesce(location,'') || ' ' || coalesce(modality,'') || ' ' ||
      replace(coalesce(experience,''), '_', ' '))
  ) stored
);
create index if not exists jobs_live_idx on jobs (status, expires_at, published_at desc);
create index if not exists jobs_fts_idx on jobs using gin (fts);
create index if not exists jobs_title_trgm on jobs using gin (title gin_trgm_ops);
create index if not exists jobs_filters_idx on jobs (category, modality, experience);
create index if not exists jobs_fp_idx on jobs (fingerprint);

create table if not exists waitlist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Resumen anónimo que queda cuando un aviso se borra
create table if not exists job_stats (
  id bigint generated always as identity primary key,
  category text, source text, modality text,
  published_at timestamptz, days_live int, views int
);

-- Solo el servidor (clave service_role) lee y escribe. Nada es accesible con la clave pública.
alter table jobs enable row level security;
alter table waitlist enable row level security;
alter table job_stats enable row level security;

-- Limpieza diaria: marca vencidos; a los 60 días de vencidos guarda la estadística y borra.
create or replace function cleanup_jobs() returns void language plpgsql as $$
begin
  update jobs set status = 'expired' where status = 'active' and expires_at <= now();
  insert into job_stats (category, source, modality, published_at, days_live, views)
    select category, source, modality, published_at,
           greatest(0, extract(day from expires_at - published_at))::int, views
    from jobs where status = 'expired' and expires_at < now() - interval '60 days';
  delete from jobs where status = 'expired' and expires_at < now() - interval '60 days';
end $$;

-- Todos los días a las 06:00 UTC (03:00 de Argentina)
select cron.schedule('puestalia-cleanup', '0 6 * * *', 'select cleanup_jobs()');
