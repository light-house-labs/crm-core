"use client";
import { config } from "@/lib/config";
import { CrmOptions, defaultCrmOptions, fetchCrmOptions } from "@/lib/crm-options";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Briefcase, Code, Calendar, DollarSign, Target } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type AssignableUser = {
  id: string;
  name: string | null;
  email: string;
};

type ContactOption = {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
};

type InitialProjectData = {
  project_name?: string;
  project_type?: string | null;
  lead_id?: string;
  description?: string | null;
  client_goals?: string | null;
  assigned_to?: string | null;
};

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('from_lead');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data for selects
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [crmOptions, setCrmOptions] = useState<CrmOptions>(defaultCrmOptions);
  
  // Pre-filled data
  const [initialData, setInitialData] = useState<InitialProjectData>({});

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const [userResult, contactResult, optionResult] = await Promise.all([
        supabase.from("allowed_users").select("id, name, email").order("name", { ascending: true }),
        supabase.from("contacts").select("id, first_name, last_name, company"),
        fetchCrmOptions(supabase),
      ]);

      if (userResult.data) setUsers(userResult.data);
      if (contactResult.data) setContacts(contactResult.data);
      setCrmOptions(optionResult.options);

      if (leadId) {
        const { data: leadData } = await supabase.from("leads").select("*").eq("id", leadId).single();
        if (leadData) {
          setInitialData({
            project_name: `${leadData.company || leadData.last_name} - ${leadData.project_type || 'Project'}`,
            project_type: leadData.project_type,
            lead_id: leadId,
            description: leadData.message,
            client_goals: leadData.notes,
            assigned_to: leadData.assigned_to,
          });
        }
      }
    }
    fetchData();
  }, [leadId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const projectData = {
      project_name: formData.get("project_name"),
      contact_id: formData.get("contact_id") || null,
      lead_id: formData.get("lead_id") || null,
      project_type: formData.get("project_type"),
      description: formData.get("description"),
      deliverables: formData.get("deliverables"),
      out_of_scope: formData.get("out_of_scope"),
      tech_stack: formData.get("tech_stack"),
      cms_hosting: formData.get("cms_hosting"),
      integrations: formData.get("integrations"),
      brand_kit_ready: formData.get("brand_kit_ready") === "on",
      existing_codebase: formData.get("existing_codebase"),
      kickoff_date: formData.get("kickoff_date") || null,
      launch_date: formData.get("launch_date") || null,
      contract_signed_at: formData.get("contract_signed_at") || null,
      total_budget: formData.get("total_budget") ? parseFloat(formData.get("total_budget") as string) : null,
      payment_structure: formData.get("payment_structure"),
      assigned_to: formData.get("assigned_to") || null,
      client_poc: formData.get("client_poc"),
      client_goals: formData.get("client_goals"),
      target_audience: formData.get("target_audience"),
      maintenance_agreed: formData.get("maintenance_agreed") === "on",
      status: "active",
      phase: "discovery",
    };

    const supabase = createClient();
    const { data: newProject, error: dbError } = await supabase.from("projects").insert([projectData]).select().single();

    if (dbError) {
      console.error(dbError);
      setError("Failed to create project. Please check fields.");
      setLoading(false);
    } else {
      if (leadId) {
        const wonStage = config.pipeline.stages.find(stage => stage.id === "won") || config.pipeline.stages.find(stage => stage.id === "converted") || config.pipeline.stages[config.pipeline.stages.length - 1];
        await supabase.from("leads").update({ 
          status: wonStage?.id || "converted",
          pipeline_stage_id: wonStage?.order,
          converted_to_project: newProject.id 
        }).eq("id", leadId);
      }
      router.push(`/projects/${newProject.id}`);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[#161616]">Project Intake Form</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Define scope, technical requirements, and timeline.</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <form key={initialData.lead_id || "manual-project"} onSubmit={handleSubmit} className="divide-y divide-[#E8E8E8]">
          {error && <div className="p-4 bg-red-50 text-red-700 text-sm font-medium">{error}</div>}
          
          <input type="hidden" name="lead_id" defaultValue={initialData.lead_id || ""} />

          {/* Section 1: Client & Identity */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-[#161616] font-bold text-lg mb-6">
              <Briefcase className="h-5 w-5 text-[#ED711D]" /> 1. Client & Identity
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Project Name <span className="text-red-500">*</span></label>
                <input type="text" name="project_name" required defaultValue={initialData.project_name || ""} className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Linked Contact</label>
                <select name="contact_id" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 bg-white focus:border-[#ED711D] outline-none">
                  <option value="">No Contact Selected</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.company})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Assigned Lead / PM</label>
                <select name="assigned_to" defaultValue={initialData.assigned_to || ""} className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 bg-white focus:border-[#ED711D] outline-none">
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Scope & Deliverables */}
          <div className="p-6 md:p-8 bg-[#FAFAFA]">
            <div className="flex items-center gap-2 text-[#161616] font-bold text-lg mb-6">
              <Target className="h-5 w-5 text-[#ED711D]" /> 2. Scope & Deliverables
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Project Type</label>
                <select name="project_type" defaultValue={initialData.project_type || ""} className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 bg-white focus:border-[#ED711D] outline-none">
                  <option value="">Select type</option>
                  {crmOptions.project_type.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Project Description</label>
                <textarea name="description" rows={3} defaultValue={initialData.description || ""} className="block w-full rounded-md border border-[#E8E8E8] p-3 focus:border-[#ED711D] outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Key Deliverables (In Scope)</label>
                <textarea name="deliverables" rows={4} placeholder="- 5 Page Website&#10;- Setup CMS&#10;- Basic SEO" className="block w-full rounded-md border border-[#E8E8E8] p-3 focus:border-[#ED711D] outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Out of Scope (Explicitly excluded)</label>
                <textarea name="out_of_scope" rows={4} placeholder="- Ongoing maintenance&#10;- Copywriting" className="block w-full rounded-md border border-[#E8E8E8] p-3 focus:border-[#ED711D] outline-none"></textarea>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Details */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-[#161616] font-bold text-lg mb-6">
              <Code className="h-5 w-5 text-[#ED711D]" /> 3. Technical Requirements
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Tech Stack</label>
                <input type="text" name="tech_stack" placeholder="Next.js, Tailwind, Supabase" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">CMS / Hosting</label>
                <input type="text" name="cms_hosting" placeholder="Sanity, Vercel" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Required Integrations</label>
                <input type="text" name="integrations" placeholder="Stripe, SendGrid, Salesforce..." className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 bg-[#F5F5F5] p-4 rounded-lg">
                <input type="checkbox" id="brand_kit_ready" name="brand_kit_ready" className="h-4 w-4 rounded border-gray-300 text-[#ED711D] focus:ring-[#ED711D]" />
                <label htmlFor="brand_kit_ready" className="text-sm font-medium text-[#161616]">Client has a ready Brand Kit (Logo, Colors, Fonts)</label>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Timeline & Financials */}
          <div className="p-6 md:p-8 bg-[#FAFAFA]">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-[#161616] font-bold text-lg mb-6">
                  <Calendar className="h-5 w-5 text-[#ED711D]" /> 4. Timeline
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Contract Signed Date</label>
                    <input type="date" name="contract_signed_at" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Target Kickoff Date</label>
                    <input type="date" name="kickoff_date" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Target Launch Date</label>
                    <input type="date" name="launch_date" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 focus:border-[#ED711D] outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[#161616] font-bold text-lg mb-6">
                  <DollarSign className="h-5 w-5 text-[#ED711D]" /> 5. Financials
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Total Agreed Budget ({config.localization.currency})</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 font-medium">
                        {config.localization.currencySymbol}
                      </div>
                      <input type="number" step="0.01" name="total_budget" className="block w-full rounded-md border border-[#E8E8E8] pl-8 pr-3 py-2 focus:border-[#ED711D] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Payment Structure</label>
                    <select name="payment_structure" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 bg-white focus:border-[#ED711D] outline-none">
                      <option value="milestone">Milestone Based (e.g. 50/25/25)</option>
                      <option value="upfront">100% Upfront</option>
                      <option value="monthly">Monthly Retainer</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 bg-[#F5F5F5] p-4 rounded-lg mt-6">
                    <input type="checkbox" id="maintenance_agreed" name="maintenance_agreed" className="h-4 w-4 rounded border-gray-300 text-[#ED711D] focus:ring-[#ED711D]" />
                    <label htmlFor="maintenance_agreed" className="text-sm font-medium text-[#161616]">Post-launch Maintenance Agreed</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#161616] flex justify-end gap-3 sticky bottom-0 z-10 border-t border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-md bg-[#ED711D] text-sm font-bold text-white shadow-sm hover:bg-[#D4611A] disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating Project..." : "Create Project"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 animate-pulse">Loading form...</div>}>
      <NewProjectContent />
    </Suspense>
  );
}
