-- supabase/seed.sql

-- 1. Reset everything (optional if using supabase db reset, but good for idempotency)
TRUNCATE public.activities, public.invoices, public.projects, public.leads, public.contacts, public.allowed_users, public.pipeline_stages CASCADE;

-- 2. Insert pipeline stages
INSERT INTO public.pipeline_stages (id, slug, label, color, "order") VALUES
(1, 'new', 'New', '#E5E7EB', 1),
(2, 'contacted', 'Contacted', '#DBEAFE', 2),
(3, 'qualified', 'Qualified', '#FEF3C7', 3),
(4, 'converted', 'Converted', '#D1FAE5', 4),
(5, 'lost', 'Lost', '#FEE2E2', 5);

-- 3. Insert an admin user
INSERT INTO public.allowed_users (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Alexander Knight', 'admin');

-- 4. Insert Premium Contacts
INSERT INTO public.contacts (id, first_name, last_name, email, phone, company, role) VALUES
('c0000000-0000-0000-0000-000000000001', 'Julian', 'Vance', 'julian@vance-aesthetics.com', '+1 (555) 012-3456', 'Vance Aesthetics', 'CEO'),
('c0000000-0000-0000-0000-000000000002', 'Elena', 'Rossi', 'elena@lumina-studios.io', '+1 (555) 987-6543', 'Lumina Studios', 'Creative Director'),
('c0000000-0000-0000-0000-000000000003', 'Dominic', 'Soto', 'dom@nexus-fintech.com', '+1 (555) 246-8135', 'Nexus Fintech', 'Product Lead');

-- 5. Insert Realistic Leads
INSERT INTO public.leads (id, first_name, last_name, company, email, project_type, budget_range, source, status, pipeline_stage_id, created_at, assigned_to) VALUES
(gen_random_uuid(), 'Sophia', 'Lars', 'Orion Group', 'sophia@orion.com', 'Enterprise SaaS', '$50k+', 'LinkedIn', 'qualified', 3, now() - interval '2 days', '00000000-0000-0000-0000-000000000001'),
(gen_random_uuid(), 'Leo', 'Drake', 'Stellar CRM', 'leo@stellar.io', 'Mobile App', '$25k–$50k', 'Website Form', 'new', 1, now() - interval '4 hours', null),
(gen_random_uuid(), 'Maya', 'Hills', 'EcoWare', 'maya@ecoware.org', 'E-commerce', '$10k–$25k', 'Referral', 'contacted', 2, now() - interval '4 days', '00000000-0000-0000-0000-000000000001');

-- 6. Insert Active Projects
INSERT INTO public.projects (id, project_ref, project_name, contact_id, project_type, phase, status, completion_pct, total_budget, kickoff_date, launch_date, assigned_to) VALUES
('p0000000-0000-0000-0000-000000000001', 'PRJ-2026-001', 'Vance Identity Rebrand', 'c0000000-0000-0000-0000-000000000001', 'Branding', 'build', 'active', 65, 12500, now() - interval '30 days', now() + interval '45 days', '00000000-0000-0000-0000-000000000001'),
('p0000000-0000-0000-0000-000000000002', 'PRJ-2026-002', 'Lumina Platform V2', 'c0000000-0000-0000-0000-000000000002', 'Web App', 'design', 'active', 25, 45000, now() - interval '10 days', now() + interval '90 days', '00000000-0000-0000-0000-000000000001');

-- 7. Insert Invoices
INSERT INTO public.invoices (id, project_id, invoice_ref, amount, status, due_date) VALUES
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001', 'INV-001', 5000, 'paid', now() - interval '25 days'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001', 'INV-002', 3750, 'sent', now() + interval '5 days'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'INV-003', 15000, 'paid', now() - interval '5 days');

-- 8. Insert Activities
INSERT INTO public.activities (id, project_id, lead_id, type, summary, created_at) VALUES
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001', null, 'call', 'Weekly sync: Design approved for the homepage hero section.', now() - interval '2 days'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', null, 'meeting', 'Discovery workshop: Defined core user personas and MVP scope.', now() - interval '8 days'),
(gen_random_uuid(), null, (SELECT id FROM public.leads LIMIT 1), 'email', 'Intro email sent to Sophia regarding Orion Group requirements.', now() - interval '1 day');
