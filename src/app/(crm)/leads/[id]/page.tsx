"use client";
import { config } from "@/lib/config";
import { CrmOptions, defaultCrmOptions, fetchCrmOptions } from "@/lib/crm-options";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit2, Check, X, Calendar, User, Phone, Mail, Globe, Building, Briefcase, Plus, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AssignableUser = {
  id: string;
  name: string | null;
  email: string;
};

type LeadRecord = {
  id: string;
  pipeline_stage_id: number | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  project_type: string | null;
  budget_range: string | null;
  status: string | null;
  created_at: string;
  message: string | null;
  notes: string | null;
  assigned_to: AssignableUser | null;
};

type EditLeadForm = Omit<LeadRecord, "assigned_to"> & {
  assigned_to: AssignableUser | null;
  assigned_to_id: string;
};

type ActivityRecord = {
  id: string;
  type: string;
  summary: string;
  created_at: string;
};

export default function LeadProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EditLeadForm>>({});
  const [crmOptions, setCrmOptions] = useState<CrmOptions>(defaultCrmOptions);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  
  // Activity form state
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");

  useEffect(() => {
    async function fetchLead() {
      const supabase = createClient();
      const { data: leadData } = await supabase.from("leads").select("*, assigned_to(id, name, email)").eq("id", params.id).single();
      if (leadData) {
        setLead(leadData);
        setEditForm({
          ...leadData,
          assigned_to_id: leadData.assigned_to?.id || "",
        });
      }
      
      const { data: actData } = await supabase.from("activities").select("*").eq("lead_id", params.id).order("created_at", { ascending: false });
      if (actData) setActivities(actData);

      const { data: userData } = await supabase.from("allowed_users").select("id, name, email").order("name", { ascending: true });
      if (userData) setUsers(userData);

      const optionResult = await fetchCrmOptions(supabase);
      setCrmOptions(optionResult.options);
      
      setLoading(false);
    }
    fetchLead();
  }, [params.id]);

  async function handleSave() {
    if (!lead) return;

    setLoading(true);
    const supabase = createClient();
    const stageId = editForm.status?.toString();
    const stage = config.pipeline.stages.find(s => s.id === stageId);

    const { error } = await supabase.from("leads").update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      company: editForm.company,
      email: editForm.email,
      phone: editForm.phone,
      website: editForm.website,
      project_type: editForm.project_type,
      budget_range: editForm.budget_range,
      status: stage?.id || editForm.status,
      pipeline_stage_id: stage?.order,
      assigned_to: editForm.assigned_to_id || null,
    }).eq("id", params.id);
    
    if (!error) {
      const selectedUser = users.find((user) => user.id === editForm.assigned_to_id) || null;
      setLead({
        ...lead,
        first_name: editForm.first_name ?? null,
        last_name: editForm.last_name ?? null,
        company: editForm.company ?? null,
        email: editForm.email ?? null,
        phone: editForm.phone ?? null,
        website: editForm.website ?? null,
        project_type: editForm.project_type ?? null,
        budget_range: editForm.budget_range ?? null,
        status: editForm.status ?? null,
        assigned_to: selectedUser,
      });
      setIsEditing(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", params.id);
    
    if (error) {
      alert("Error deleting lead: " + error.message);
      setLoading(false);
    } else {
      router.push("/leads");
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityText.trim()) return;
    
    const supabase = createClient();
    const newActivity = {
      lead_id: params.id,
      type: activityType,
      summary: activityText,
    };
    
    const { data } = await supabase.from("activities").insert([newActivity]).select().single();
    if (data) {
      setActivities([data, ...activities]);
      setActivityText("");
    }
  }

  if (loading && !lead) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading lead profile...</div>;
  if (!lead) return <div className="p-8 text-center text-red-500">Lead not found.</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ED711D]/10 text-xl font-bold text-[#ED711D]">
              {(lead.first_name || lead.company || "?")[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#161616]">{lead.first_name} {lead.last_name}</h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">{lead.company} · {lead.project_type}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push(`/projects/new?from_lead=${params.id}`)} className="rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#3D3D3D] hover:bg-[#F5F5F5] transition-colors">
            Convert to Project
          </button>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 rounded-md bg-[#ED711D] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#D4611A] transition-colors">
              <Edit2 className="h-4 w-4" /> Edit Lead
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); setEditForm({ ...lead, assigned_to_id: lead.assigned_to?.id || "" }); }} className="flex items-center gap-2 rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-700 transition-colors">
                <Check className="h-4 w-4" /> Save
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#E8E8E8] px-6 py-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#161616]">Lead Information</h3>
              <select 
                disabled={!isEditing}
                value={editForm.status || ""}
                onChange={(e) => {
                  const stage = config.pipeline.stages.find(s => s.id === e.target.value);
                  setEditForm({...editForm, status: e.target.value, pipeline_stage_id: stage?.order});
                }}
                className="text-xs font-semibold rounded-full px-3 py-1 bg-gray-100 border border-gray-200 outline-none focus:border-[#ED711D] disabled:opacity-80 disabled:cursor-not-allowed disabled:appearance-none"
              >
                {config.pipeline.stages.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Email</p>
                    {isEditing ? (
                      <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none" />
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5 truncate"><a href={`mailto:${lead.email}`} className="hover:text-[#ED711D]">{lead.email}</a></p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Phone</p>
                    {isEditing ? (
                      <input type="tel" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none" />
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5">{lead.phone || "—"}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Building className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Company</p>
                    {isEditing ? (
                      <input type="text" value={editForm.company || ""} onChange={e => setEditForm({...editForm, company: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none" />
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5">{lead.company || "—"}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Website</p>
                    {isEditing ? (
                      <input type="url" value={editForm.website || ""} onChange={e => setEditForm({...editForm, website: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none" />
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5 truncate">{lead.website ? <a href={lead.website} target="_blank" className="hover:text-[#ED711D]">{lead.website}</a> : "—"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Briefcase className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Project Type</p>
                    {isEditing ? (
                      <select value={editForm.project_type || ""} onChange={e => setEditForm({...editForm, project_type: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none bg-white">
                        <option value="">Select...</option>
                        {crmOptions.project_type.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5">{lead.project_type || "—"}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <DollarSign className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Approx Budget</p>
                    {isEditing ? (
                      <select value={editForm.budget_range || ""} onChange={e => setEditForm({...editForm, budget_range: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none bg-white">
                        <option value="">Select...</option>
                        {crmOptions.budget_range.map(br => <option key={br} value={br}>{br}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5">{lead.budget_range || "—"}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Created At</p>
                    <p className="text-sm font-medium text-[#161616] mt-0.5">{new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-[#ABABAB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Assigned To</p>
                    {isEditing ? (
                      <select value={editForm.assigned_to_id || ""} onChange={e => setEditForm({...editForm, assigned_to_id: e.target.value})} className="mt-1 w-full border border-[#E8E8E8] rounded px-2 py-1 text-sm focus:border-[#ED711D] outline-none bg-white">
                        <option value="">Unassigned</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name || user.email}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-[#161616] mt-0.5">{lead.assigned_to?.name || lead.assigned_to?.email || "Unassigned"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message from Lead */}
            {lead.message && (
              <div className="border-t border-[#E8E8E8] p-6 bg-[#FAFAFA]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2">Original Message</p>
                <div className="text-sm text-[#3D3D3D] whitespace-pre-wrap">{lead.message}</div>
              </div>
            )}
            
            {/* Notes */}
            {lead.notes && (
              <div className="border-t border-[#E8E8E8] p-6 bg-yellow-50/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-yellow-800 mb-2">Internal Notes</p>
                <div className="text-sm text-yellow-900 whitespace-pre-wrap">{lead.notes}</div>
              </div>
            )}
          </div>
          
          <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-base font-bold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-[#6B6B6B] mb-4">Deleting a lead permanently removes it from the database.</p>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-50 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm flex flex-col h-[600px]">
            <div className="border-b border-[#E8E8E8] px-5 py-4 shrink-0">
              <h3 className="text-sm font-semibold text-[#161616]">Activity Log</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activities.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#ABABAB]">No activities logged yet.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="relative pl-6">
                    <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-[#ED711D]"></div>
                    <div className="absolute left-1 top-4 -bottom-6 w-px bg-[#E8E8E8]"></div>
                    <p className="text-xs text-[#ABABAB] mb-1">{new Date(act.created_at).toLocaleString()}</p>
                    <p className="text-sm text-[#3D3D3D] font-medium mb-1 capitalize">{act.type}</p>
                    <p className="text-sm text-[#161616] bg-[#F5F5F5] rounded-md p-3">{act.summary}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#E8E8E8] p-4 shrink-0 bg-[#FAFAFA]">
              <form onSubmit={handleAddActivity}>
                <div className="flex gap-2 mb-3">
                  <select value={activityType} onChange={e => setActivityType(e.target.value)} className="text-xs rounded-md border border-[#E8E8E8] px-2 py-1.5 focus:border-[#ED711D] outline-none">
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <textarea
                  value={activityText}
                  onChange={e => setActivityText(e.target.value)}
                  placeholder="Log a call, email, or internal note..."
                  className="w-full text-sm rounded-md border border-[#E8E8E8] p-3 focus:border-[#ED711D] outline-none mb-3 resize-none"
                  rows={3}
                  required
                ></textarea>
                <button type="submit" disabled={!activityText.trim()} className="w-full flex items-center justify-center gap-2 rounded-md bg-[#161616] px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-50 transition-colors">
                  <Plus className="h-4 w-4" /> Log Activity
                </button>
              </form>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
