alter table public.projects
  add column if not exists shopify_theme    text,
  add column if not exists seo_required     boolean default false,
  add column if not exists hosting_provider text;
