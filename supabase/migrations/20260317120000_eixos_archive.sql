-- Arquivo semanal por eixo temático
-- Espelha a lógica de briefings_archive mas por eixo
create table if not exists public.eixos_archive (
  id uuid primary key default gen_random_uuid(),
  axis text not null,
  axis_label text not null,
  week_start date not null,
  week_end date not null,
  week_label text not null,
  top_keywords jsonb default '[]'::jsonb,
  top_questions jsonb default '[]'::jsonb,
  top_debunking jsonb default '[]'::jsonb,
  top_news jsonb default '[]'::jsonb,
  top_youtube jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(axis, week_start)
);

-- Allow public read access (same as other tables)
alter table public.eixos_archive enable row level security;

create policy "Public read access"
  on public.eixos_archive
  for select
  using (true);

create policy "Public insert access"
  on public.eixos_archive
  for insert
  with check (true);
