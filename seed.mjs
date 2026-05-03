import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding database...");

  // Delete existing data (Cascade emulation)
  console.log("Cleaning existing data...");
  // Using a very large number for int IDs and a valid UUID for uuid IDs
  await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('allowed_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pipeline_stages').delete().neq('id', 0);

  // Insert pipeline stages
  console.log("Inserting pipeline stages...");
  const { error: psError } = await supabase.from('pipeline_stages').insert([
    { id: 1, slug: 'new', label: 'New', color: '#E5E7EB', order: 1 },
    { id: 2, slug: 'contacted', label: 'Contacted', color: '#DBEAFE', order: 2 },
    { id: 3, slug: 'qualified', label: 'Qualified', color: '#FEF3C7', order: 3 },
    { id: 4, slug: 'converted', label: 'Converted', color: '#D1FAE5', order: 4 },
    { id: 5, slug: 'lost', label: 'Lost', color: '#FEE2E2', order: 5 }
  ]);
  if (psError) console.error("Error inserting pipeline_stages:", psError.message);

  // Insert an admin user
  console.log("Inserting admin user...");
  const adminId = '00000000-0000-0000-0000-000000000001';
  const { error: auError } = await supabase.from('allowed_users').insert([
    { id: adminId, email: 'admin@example.com', name: 'Alexander Knight', role: 'admin' }
  ]);
  if (auError) console.error("Error inserting allowed_users:", auError.message);

  // Insert Premium Contacts
  console.log("Inserting contacts...");
  const contact1Id = 'c0000000-0000-0000-0000-000000000001';
  const contact2Id = 'c0000000-0000-0000-0000-000000000002';
  const contact3Id = 'c0000000-0000-0000-0000-000000000003';
  const { error: cError } = await supabase.from('contacts').insert([
    { id: contact1Id, first_name: 'Julian', last_name: 'Vance', email: 'julian@vance-aesthetics.com', phone: '+1 (555) 012-3456', company: 'Vance Aesthetics' },
    { id: contact2Id, first_name: 'Elena', last_name: 'Rossi', email: 'elena@lumina-studios.io', phone: '+1 (555) 987-6543', company: 'Lumina Studios' },
    { id: contact3Id, first_name: 'Dominic', last_name: 'Soto', email: 'dom@nexus-fintech.com', phone: '+1 (555) 246-8135', company: 'Nexus Fintech' }
  ]);
  if (cError) console.error("Error inserting contacts:", cError.message);

  // Insert Realistic Leads
  console.log("Inserting leads...");
  const lead1Id = crypto.randomUUID();
  const lead2Id = crypto.randomUUID();
  const lead3Id = crypto.randomUUID();
  
  const { error: lError } = await supabase.from('leads').insert([
    { id: lead1Id, first_name: 'Sophia', last_name: 'Lars', company: 'Orion Group', email: 'sophia@orion.com', project_type: 'Enterprise SaaS', budget_range: '$50k+', source: 'LinkedIn', status: 'qualified', pipeline_stage_id: 3, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), assigned_to: adminId },
    { id: lead2Id, first_name: 'Leo', last_name: 'Drake', company: 'Stellar CRM', email: 'leo@stellar.io', project_type: 'Mobile App', budget_range: '$25k–$50k', source: 'Website Form', status: 'new', pipeline_stage_id: 1, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), assigned_to: null },
    { id: lead3Id, first_name: 'Maya', last_name: 'Hills', company: 'EcoWare', email: 'maya@ecoware.org', project_type: 'E-commerce', budget_range: '$10k–$25k', source: 'Referral', status: 'contacted', pipeline_stage_id: 2, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), assigned_to: adminId }
  ]);
  if (lError) console.error("Error inserting leads:", lError.message);

  // Insert Active Projects
  console.log("Inserting projects...");
  const project1Id = 'f0000000-0000-0000-0000-000000000001';
  const project2Id = 'f0000000-0000-0000-0000-000000000002';
  const { error: pError } = await supabase.from('projects').insert([
    { id: project1Id, project_name: 'Vance Identity Rebrand', contact_id: contact1Id, project_type: 'Branding', phase: 'build', status: 'active', total_budget: 12500 },
    { id: project2Id, project_name: 'Lumina Platform V2', contact_id: contact2Id, project_type: 'Web App', phase: 'design', status: 'active', total_budget: 45000 }
  ]);
  if (pError) console.error("Error inserting projects:", pError.message);

  // Insert Invoices
  console.log("Inserting invoices...");
  const { error: iError } = await supabase.from('invoices').insert([
    { id: crypto.randomUUID(), project_id: project1Id, amount: 5000, status: 'paid' },
    { id: crypto.randomUUID(), project_id: project1Id, amount: 3750, status: 'sent' },
    { id: crypto.randomUUID(), project_id: project2Id, amount: 15000, status: 'paid' }
  ]);
  if (iError) console.error("Error inserting invoices:", iError.message);

  // Insert Activities
  console.log("Inserting activities...");
  const { error: aError } = await supabase.from('activities').insert([
    { id: crypto.randomUUID(), project_id: project1Id, lead_id: null, type: 'call', summary: 'Weekly sync: Design approved for the homepage hero section.', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: crypto.randomUUID(), project_id: project2Id, lead_id: null, type: 'meeting', summary: 'Discovery workshop: Defined core user personas and MVP scope.', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: crypto.randomUUID(), project_id: null, lead_id: lead1Id, type: 'email', summary: 'Intro email sent to Sophia regarding Orion Group requirements.', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
  ]);
  if (aError) console.error("Error inserting activities:", aError.message);

  console.log("Seeding complete!");
}

seed().catch(console.error);
