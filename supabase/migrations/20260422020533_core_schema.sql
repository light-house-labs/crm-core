-- 00001_core_schema.sql
-- Create all tables in exact order to satisfy foreign key constraints.

-- 1. allowed_users
create table public.allowed_users (
  id          uuid        primary key default gen_random_uuid(),
  email       text        unique not null,
  name        text,
  role        text        default 'member',   -- 'admin' | 'member'
  added_at    timestamptz default now(),
  added_by    text
);
alter table public.allowed_users enable row level security;

-- 2. pipeline_stages
create table public.pipeline_stages (
  id      smallint  primary key,
  slug    text      unique not null,          -- e.g. 'discovery_call'
  label   text      not null,                 -- e.g. 'Discovery Call'
  color   text,
  "order" smallint  not null
);
alter table public.pipeline_stages enable row level security;

-- 3. leads
create table public.leads (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  -- Source tracking
  source                text,
  outreach_channel      text,
  utm_source            text,

  -- Status
  status                text        default 'new',
  pipeline_stage_id     smallint    references public.pipeline_stages(id),

  -- Contact info
  first_name            text,
  last_name             text,
  email                 text,
  phone                 text,
  company               text,
  website               text,

  -- Project intent
  project_type          text,
  budget_range          text,
  timeline              text,
  message               text,

  -- CRM fields
  assigned_to           uuid        references public.allowed_users(id),
  converted_to_project  uuid,       -- FK added later
  notes                 text,
  last_contacted_at     timestamptz,
  follow_up_at          timestamptz,
  disqualified_reason   text
);

alter table public.leads enable row level security;
create index on public.leads (status);
create index on public.leads (assigned_to);
create index on public.leads (created_at desc);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function update_updated_at();

-- 4. contacts
create table public.contacts (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  first_name      text        not null,
  last_name       text        not null,
  email           text,
  phone           text,
  company         text,
  role            text,
  billing_email   text,
  linkedin_url    text,
  lead_id         uuid        references public.leads(id) on delete set null,
  notes           text
);
alter table public.contacts enable row level security;

-- 5. projects
create table public.projects (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  -- Identity
  project_name          text        not null,
  project_ref           text        unique,
  contact_id            uuid        references public.contacts(id),
  lead_id               uuid        references public.leads(id),

  -- Scope
  project_type          text,
  description           text,
  deliverables          text,
  out_of_scope          text,

  -- Technical
  tech_stack            text,
  cms_hosting           text,
  integrations          text,
  brand_kit_ready       boolean     default false,
  existing_codebase     text,

  -- Timeline
  kickoff_date          date,
  launch_date           date,
  contract_signed_at    date,

  -- Financial
  total_budget          numeric(12,2),
  payment_structure     text,
  currency              text        default 'INR',

  -- Status
  phase                 text        default 'discovery',
  completion_pct        smallint    default 0 check (completion_pct between 0 and 100),
  status                text        default 'active',

  -- Team
  assigned_to           uuid        references public.allowed_users(id),
  client_poc            text,

  -- Discovery
  client_goals          text,
  target_audience       text,
  reference_sites       text,
  performance_targets   text,

  -- Post-launch
  maintenance_agreed    boolean     default false,
  maintenance_months    smallint,
  hosting_handover      text,
  checkin_30d           date,
  checkin_60d           date,
  checkin_90d           date,

  notes                 text
);

alter table public.projects enable row level security;
create index on public.projects (status);
create index on public.projects (phase);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();

-- Add FK from leads back to projects
alter table public.leads
  add constraint leads_converted_to_project_fkey
  foreign key (converted_to_project) references public.projects(id) on delete set null;

-- 6. invoices
create table public.invoices (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   default now(),
  project_id      uuid          not null references public.projects(id) on delete cascade,
  invoice_number  text,
  amount          numeric(12,2) not null,
  currency        text          default 'INR',
  due_date        date,
  paid_at         timestamptz,
  status          text          default 'draft',
  notes           text
);
alter table public.invoices enable row level security;
create index on public.invoices (project_id);
create index on public.invoices (status);

-- 7. activities
create table public.activities (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  type            text        not null,
  lead_id         uuid        references public.leads(id) on delete cascade,
  project_id      uuid        references public.projects(id) on delete cascade,
  contact_id      uuid        references public.contacts(id) on delete set null,
  performed_by    uuid        references public.allowed_users(id),
  summary         text        not null,
  next_action     text,
  next_action_at  timestamptz,

  constraint activity_must_have_context check (
    lead_id is not null or project_id is not null
  )
);
alter table public.activities enable row level security;
create index on public.activities (lead_id, created_at desc);
create index on public.activities (project_id, created_at desc);

-- 8. Auth Trigger (Whitelist)
CREATE OR REPLACE FUNCTION enforce_user_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.allowed_users
    WHERE email = NEW.email
  ) THEN
    RAISE EXCEPTION
      'access_denied: % is not authorised to access this application.', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_whitelist_before_user_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_user_whitelist();

-- 9. Row Level Security Policies
create policy "Whitelisted users have full access" on public.leads
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Public can submit leads" on public.leads
  for insert
  with check (
    source in ('website_form', 'cold_email', 'linkedin', 'instagram', 'referral', 'other')
    and status = 'new'
    and assigned_to is null
    and notes is null
  );

create policy "Whitelisted users have full access" on public.contacts
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Whitelisted users have full access" on public.projects
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Whitelisted users have full access" on public.invoices
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Whitelisted users have full access" on public.activities
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Whitelisted users have full access" on public.pipeline_stages
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

create policy "Whitelisted users have full access" on public.allowed_users
  for all
  using (auth.email() in (select email from public.allowed_users))
  with check (auth.email() in (select email from public.allowed_users));

-- 10. Auto-generated project reference
create sequence project_ref_seq start 1;

create or replace function generate_project_ref()
returns trigger as $$
begin
  new.project_ref := 'CRM-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('project_ref_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_project_ref
  before insert on public.projects
  for each row
  when (new.project_ref is null)
  execute function generate_project_ref();
