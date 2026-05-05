"use client";
import { config } from "@/lib/config";
import { CrmOptions, defaultCrmOptions, fetchCrmOptions } from "@/lib/crm-options";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AssignableUser = {
  id: string;
  name: string | null;
  email: string;
};

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [crmOptions, setCrmOptions] = useState<CrmOptions>(defaultCrmOptions);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [userResult, optionResult] = await Promise.all([
        supabase.from("allowed_users").select("id, name, email").order("name", { ascending: true }),
        fetchCrmOptions(supabase),
      ]);
      if (userResult.data) setUsers(userResult.data);
      setCrmOptions(optionResult.options);
    }
    void fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const stageId = formData.get("status")?.toString() || config.pipeline.stages[0]?.id || "new";
    const stage = config.pipeline.stages.find(s => s.id === stageId);

    const data = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      website: formData.get("website"),
      project_type: formData.get("project_type"),
      budget_range: formData.get("budget_range"),
      timeline: formData.get("timeline"),
      outreach_channel: formData.get("outreach_channel"),
      assigned_to: formData.get("assigned_to") || null,
      status: stage?.id || stageId,
      pipeline_stage_id: stage?.order || 1,
      notes: formData.get("notes"),
      follow_up_at: formData.get("follow_up_at") || null,
      source: formData.get("outreach_channel") || "other",
    };

    const supabase = createClient();
    const { error: dbError } = await supabase.from("leads").insert([data]);

    if (dbError) {
      console.error(dbError);
      setError("Failed to create lead. Please check the fields and try again.");
      setLoading(false);
    } else {
      router.push("/leads");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Add New Lead</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">Manually enter a lead from offline channels.</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-[#E8E8E8]">
          
          {error && (
            <div className="p-5 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Section: Contact Info */}
          <div className="p-6 md:p-8">
            <h3 className="text-base font-semibold text-[#161616] mb-5">Contact Details</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">First name <span className="text-red-500">*</span></label>
                <input type="text" name="first_name" required className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Last name <span className="text-red-500">*</span></label>
                <input type="text" name="last_name" required className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Email address <span className="text-red-500">*</span></label>
                <input type="email" name="email" required className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Phone number</label>
                <input type="tel" name="phone" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Company</label>
                <input type="text" name="company" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Website</label>
                <input type="url" name="website" placeholder="https://" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
            </div>
          </div>

          {/* Section: Project Intent */}
          <div className="p-6 md:p-8 bg-[#FAFAFA]">
            <h3 className="text-base font-semibold text-[#161616] mb-5">Project Intent</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Project Type <span className="text-red-500">*</span></label>
                <select name="project_type" required className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  <option value="">Select project type...</option>
                  {crmOptions.project_type.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Approx Budget</label>
                <select name="budget_range" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  <option value="">Select range...</option>
                  {crmOptions.budget_range.map(br => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Timeline</label>
                <select name="timeline" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  <option value="">Select timeline...</option>
                  {crmOptions.timeline.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: CRM Internal Info */}
          <div className="p-6 md:p-8">
            <h3 className="text-base font-semibold text-[#161616] mb-5">Internal Details</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Stage</label>
                <select name="status" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  {config.pipeline.stages.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Assigned To</label>
                <select name="assigned_to" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Outreach Channel</label>
                <select name="outreach_channel" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                  <option value="">Select channel...</option>
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Follow-up Date</label>
                <input type="date" name="follow_up_at" className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Internal Notes</label>
                <textarea name="notes" rows={3} placeholder="Private notes, not visible to client..." className="block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]"></textarea>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#F5F5F5] flex justify-end gap-3">
            <Link href="/leads" className="px-4 py-2 rounded-md border border-[#E8E8E8] bg-white text-sm font-medium text-[#3D3D3D] hover:bg-[#FAFAFA]">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-[#ED711D] text-sm font-bold text-white shadow-sm hover:bg-[#D4611A] focus:outline-none focus:ring-2 focus:ring-[#ED711D] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
