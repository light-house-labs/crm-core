alter table public.leads
  add column if not exists shopify_store      text,
  add column if not exists current_platform   text,
  add column if not exists has_existing_brand boolean default false;
