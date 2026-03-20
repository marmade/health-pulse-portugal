create table public.revisao_pares (
  id uuid primary key default gen_random_uuid(),
  eixo text not null,
  nome text,
  titulo text,
  afiliacao text,
  nota text,
  created_at timestamptz default now()
);

alter table public.revisao_pares enable row level security;

create policy "Leitura pública" on public.revisao_pares for select using (true);