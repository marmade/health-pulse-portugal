-- Tabela: Revisão de Pares por eixo temático
-- Dois perfis científicos complementares por eixo, editáveis no admin
create table if not exists public.revisao_pares (
  id uuid primary key default gen_random_uuid(),
  axis text not null unique,
  axis_label text not null,

  -- Perfil A
  nome_a text default '',
  especialidade_a text default '',
  telefone_a text default '',
  email_a text default '',
  link_a text default '',

  -- Perfil B
  nome_b text default '',
  especialidade_b text default '',
  telefone_b text default '',
  email_b text default '',
  link_b text default '',

  -- Sumário do eixo
  sumario text default '',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.revisao_pares enable row level security;
create policy "Public read" on public.revisao_pares for select using (true);
create policy "Public insert" on public.revisao_pares for insert with check (true);
create policy "Public update" on public.revisao_pares for update using (true);

-- Seed: uma linha por eixo
insert into public.revisao_pares (axis, axis_label) values
  ('saude-mental', 'Saúde Mental'),
  ('alimentacao', 'Alimentação'),
  ('menopausa', 'Menopausa'),
  ('emergentes', 'Emergentes')
on conflict (axis) do nothing;
