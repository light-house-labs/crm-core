create table if not exists public.crm_options (
  id          uuid        primary key default gen_random_uuid(),
  category    text        not null check (category in ('project_type', 'budget_range', 'timeline')),
  value       text        not null,
  position    smallint    not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category, value)
);

alter table public.crm_options enable row level security;

create trigger crm_options_updated_at
  before update on public.crm_options
  for each row execute function update_updated_at();

create policy "Public can read CRM options" on public.crm_options
  for select
  using (true);

create policy "Whitelisted users can manage CRM options" on public.crm_options
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

insert into public.crm_options (category, value, position) values
  ('project_type', 'Option 1', 1),
  ('project_type', 'Option 2', 2),
  ('project_type', 'Option 3', 3),
  ('budget_range', 'Low', 1),
  ('budget_range', 'Medium', 2),
  ('budget_range', 'High', 3),
  ('timeline', 'Short', 1),
  ('timeline', 'Medium', 2),
  ('timeline', 'Long', 3)
on conflict (category, value) do nothing;
