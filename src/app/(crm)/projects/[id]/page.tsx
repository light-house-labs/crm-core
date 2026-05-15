"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "@/lib/config";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Target, Code, Calendar, DollarSign, FileText, Activity, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const phases = ["discovery", "design", "build", "review", "launch", "live"];

export default function ProjectProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pctForm, setPctForm] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ amount: "", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: "" });
  const [editForm, setEditForm] = useState({ description: "", deliverables: "", out_of_scope: "", tech_stack: "", cms_hosting: "", integrations: "" });

  useEffect(() => {
    async function fetchProject() {
      const supabase = createClient();
      
      const { data: projData } = await supabase.from("projects")
        .select("*, contacts(first_name, last_name, company), assigned_to:allowed_users(name, email), leads!projects_lead_id_fkey(source)")
        .eq("id", params.id)
        .single();
        
      if (projData) {
        setProject(projData);
        setPctForm(projData.completion_pct || 0);
        setEditForm({
          description: projData.description || "",
          deliverables: projData.deliverables || "",
          out_of_scope: projData.out_of_scope || "",
          tech_stack: projData.tech_stack || "",
          cms_hosting: projData.cms_hosting || "",
          integrations: projData.integrations || "",
        });
      }
      
      const { data: invData } = await supabase.from("invoices").select("*").eq("project_id", params.id).order("due_date", { ascending: true });
      if (invData) setInvoices(invData);
      
      // Load activities related to project (and its lead)
      let actQuery = supabase.from("activities").select("*");
      if (projData && projData.lead_id) {
        actQuery = actQuery.or(`project_id.eq.${params.id},lead_id.eq.${projData.lead_id}`);
      } else {
        actQuery = actQuery.eq("project_id", params.id);
      }
      const { data: actData } = await actQuery.order("created_at", { ascending: false });
      if (actData) setActivities(actData);
      
      const { data: userData } = await supabase.from("allowed_users").select("id, name, email").order("name", { ascending: true });
      if (userData) setUsers(userData);
      
      setLoading(false);
    }
    fetchProject();
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", params.id);
    
    if (error) {
      alert("Error deleting project: " + error.message);
      setLoading(false);
    } else {
      router.push("/projects");
    }
  }

  async function updateAssignment(userId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("projects").update({ assigned_to: userId || null }).eq("id", params.id);
    if (!error) {
      const newUser = users.find(u => u.id === userId) || null;
      setProject({ ...project, assigned_to: newUser });
    }
  }

  async function updatePhase(newPhase: string) {
    const supabase = createClient();
    await supabase.from("projects").update({ phase: newPhase }).eq("id", params.id);
    setProject({ ...project, phase: newPhase });
  }

  async function updateProgress() {
    const supabase = createClient();
    await supabase.from("projects").update({ completion_pct: pctForm }).eq("id", params.id);
    setProject({ ...project, completion_pct: pctForm });
    setIsEditing(false);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceForm.amount || isNaN(Number(invoiceForm.amount))) return;
    
    setLoading(true);
    const supabase = createClient();
    const newInvoice = {
      project_id: params.id,
      invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: Number(invoiceForm.amount),
      due_date: invoiceForm.due_date,
      notes: invoiceForm.notes,
      status: 'draft'
    };
    
    const { data, error } = await supabase.from('invoices').insert(newInvoice).select().single();
    if (error) {
      alert("Error creating invoice: " + error.message);
    } else {
      setInvoices([...invoices, data]);
      setIsInvoiceModalOpen(false);
      setInvoiceForm({ amount: "", due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: "" });
    }
    setLoading(false);
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('projects').update(editForm).eq('id', params.id);
    if (error) {
      alert("Error updating project: " + error.message);
    } else {
      setProject({ ...project, ...editForm });
      setIsEditModalOpen(false);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-[#161616] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                {project.project_ref}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {project.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#161616]">{project.project_name}</h2>
            <p className="text-sm text-[#6B6B6B] mt-0.5">{project.contacts?.company || "No Company"} · {project.project_type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 rounded-md bg-white text-sm font-bold text-[#161616] border border-[#E8E8E8] shadow-sm hover:bg-[#F5F5F5] transition-colors">
            Edit Project
          </button>
          <button onClick={() => setIsInvoiceModalOpen(true)} className="flex items-center gap-2 rounded-md bg-[#ED711D] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#D4611A] transition-colors">
            <Plus className="h-4 w-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Phase Tracker */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-[#161616] mb-5">Project Phase</h3>
        <div className="flex items-center">
          {phases.map((p, idx) => {
            const isCurrent = project.phase === p;
            const isPast = phases.indexOf(project.phase) > idx;
            
            return (
              <div key={p} className="flex-1 relative">
                <div className="flex items-center">
                  <button
                    onClick={() => updatePhase(p)}
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      isPast ? "border-[#ED711D] bg-[#ED711D] text-white" : 
                      isCurrent ? "border-[#ED711D] bg-white text-[#ED711D]" : 
                      "border-[#E8E8E8] bg-white text-[#ABABAB] hover:border-[#D0D0D0]"
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </button>
                  {idx < phases.length - 1 && (
                    <div className={`h-1 flex-1 transition-colors ${isPast ? "bg-[#ED711D]" : "bg-[#E8E8E8]"}`}></div>
                  )}
                </div>
                <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isCurrent ? "text-[#ED711D]" : isPast ? "text-[#161616]" : "text-[#ABABAB]"}`}>
                  {p}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm">
            <div className="border-b border-[#E8E8E8] px-6 py-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#161616]">Project Overview</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B6B6B]">Progress:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" max="100" value={pctForm} onChange={e => setPctForm(Number(e.target.value))} className="w-16 rounded border border-[#E8E8E8] px-2 py-1 text-xs outline-none focus:border-[#ED711D]" />
                      <button onClick={updateProgress} className="bg-[#ED711D] text-white p-1 rounded hover:bg-[#D4611A]"><Check className="h-3 w-3"/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditing(true)}>
                      <div className="w-24 bg-[#E8E8E8] rounded-full h-2">
                        <div className="bg-[#ED711D] h-2 rounded-full" style={{ width: `${project.completion_pct || 0}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-[#161616] group-hover:text-[#ED711D]">{project.completion_pct || 0}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ABABAB] mb-3">
                  <Target className="h-4 w-4" /> Scope
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Description</p>
                    <p className="text-sm text-[#161616]">{project.description || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Deliverables</p>
                    <p className="text-sm text-[#161616] whitespace-pre-wrap">{project.deliverables || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Out of Scope</p>
                    <p className="text-sm text-[#161616] whitespace-pre-wrap">{project.out_of_scope || "—"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ABABAB] mb-3">
                  <Code className="h-4 w-4" /> Technical
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Tech Stack</p>
                    <p className="text-sm text-[#161616] font-medium">{project.tech_stack || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">CMS / Hosting</p>
                    <p className="text-sm text-[#161616] font-medium">{project.cms_hosting || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Integrations</p>
                    <p className="text-sm text-[#161616] font-medium">{project.integrations || "—"}</p>
                  </div>
                  <div className="flex gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${project.brand_kit_ready ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Brand Kit
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${project.maintenance_agreed ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      Maintenance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#E8E8E8] px-6 py-4 flex justify-between items-center bg-[#FAFAFA]">
              <h3 className="text-sm font-semibold text-[#161616] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" /> Financials
              </h3>
              <p className="text-sm font-bold text-[#161616]">{config.localization.currencySymbol}{project.total_budget?.toLocaleString() || "0.00"}</p>
            </div>
            
            <div className="divide-y divide-[#E8E8E8]">
              {invoices.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#ABABAB]">No invoices created for this project yet.</div>
              ) : invoices.map(inv => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#161616]">{inv.invoice_ref}</p>
                      <p className="text-xs text-[#6B6B6B]">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#161616]">{config.localization.currencySymbol}{inv.amount.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Activity */}
        <div className="space-y-6">
          
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#161616] mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ED711D]" /> Important Dates
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6B6B6B]">Contract Signed</span>
                <span className="text-sm font-medium text-[#161616]">{project.contract_signed_at ? new Date(project.contract_signed_at).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6B6B6B]">Kickoff</span>
                <span className="text-sm font-medium text-[#161616]">{project.kickoff_date ? new Date(project.kickoff_date).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6B6B6B]">Target Launch</span>
                <span className="text-sm font-medium text-[#161616]">{project.launch_date ? new Date(project.launch_date).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6B6B6B]">Assigned To</span>
                <select 
                  value={project.assigned_to?.id || ""} 
                  onChange={(e) => updateAssignment(e.target.value)}
                  className="text-sm font-medium text-[#161616] bg-transparent border-none focus:ring-0 cursor-pointer hover:text-[#ED711D] text-right p-0 outline-none"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm flex flex-col h-[400px]">
            <div className="border-b border-[#E8E8E8] px-5 py-4 shrink-0">
              <h3 className="text-sm font-semibold text-[#161616] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#ABABAB]" /> Project Log
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activities.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#ABABAB]">No activities found.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[#ED711D]"></div>
                    <div className="absolute left-1 top-4 -bottom-4 w-px bg-[#E8E8E8]"></div>
                    <p className="text-xs text-[#ABABAB] mb-0.5">{new Date(act.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-[#161616]">{act.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
        
      </div>

      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
              <h3 className="text-lg font-bold text-[#161616]">Create Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-[#6B6B6B] hover:text-[#161616]">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Amount ({config.localization.currency})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                  className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Due Date</label>
                <input 
                  type="date" 
                  required 
                  value={invoiceForm.due_date}
                  onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                  className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#161616] mb-1.5">Notes</label>
                <textarea 
                  rows={3} 
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                  placeholder="Optional details..."
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#161616]">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#ED711D] text-sm font-bold text-white hover:bg-[#D4611A] disabled:opacity-50">
                  {loading ? "Saving..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-[#161616]">Edit Project Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#6B6B6B] hover:text-[#161616]">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#ABABAB]">Scope</h4>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Description</label>
                    <textarea 
                      rows={3} 
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Deliverables</label>
                    <textarea 
                      rows={4} 
                      value={editForm.deliverables}
                      onChange={e => setEditForm({...editForm, deliverables: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Out of Scope</label>
                    <textarea 
                      rows={2} 
                      value={editForm.out_of_scope}
                      onChange={e => setEditForm({...editForm, out_of_scope: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#ABABAB]">Technical</h4>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Tech Stack</label>
                    <input 
                      type="text" 
                      value={editForm.tech_stack}
                      onChange={e => setEditForm({...editForm, tech_stack: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">CMS / Hosting</label>
                    <input 
                      type="text" 
                      value={editForm.cms_hosting}
                      onChange={e => setEditForm({...editForm, cms_hosting: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#161616] mb-1.5">Integrations</label>
                    <textarea 
                      rows={2} 
                      value={editForm.integrations}
                      onChange={e => setEditForm({...editForm, integrations: e.target.value})}
                      className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-[#E8E8E8] flex justify-between items-center">
                <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:text-red-800">
                  Delete Project
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[#6B6B6B] hover:text-[#161616]">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#ED711D] text-sm font-bold text-white hover:bg-[#D4611A] disabled:opacity-50">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
