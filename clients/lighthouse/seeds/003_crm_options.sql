delete from public.crm_options
where category in ('project_type', 'budget_range', 'timeline');

insert into public.crm_options (category, value, position) values
  ('project_type', 'Website', 1),
  ('project_type', 'E-commerce store', 2),
  ('project_type', 'Web application', 3),
  ('project_type', 'Digital presence', 4),
  ('project_type', 'Not sure', 5),
  ('budget_range', 'Under ₹1L', 1),
  ('budget_range', '₹1L–3L', 2),
  ('budget_range', '₹3L–10L', 3),
  ('budget_range', 'Above ₹10L', 4),
  ('budget_range', 'Not sure yet', 5),
  ('timeline', 'ASAP', 1),
  ('timeline', '1–3 months', 2),
  ('timeline', '3–6 months', 3),
  ('timeline', 'Flexible', 4)
on conflict (category, value) do update set position = excluded.position;
