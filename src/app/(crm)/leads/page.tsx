"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, Search, ArrowUpDown, ExternalLink, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-gray-100 text-gray-700 border border-gray-200" },
  contacted: { label: "Contacted", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  qualified: { label: "Qualified", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  converted: { label: "Converted", className: "bg-green-50 text-green-700 border border-green-200" },
  lost: { label: "Lost", className: "bg-red-50 text-red-700 border border-red-200" },
};

const sourceConfig: Record<string, string> = {
  "LinkedIn": "bg-blue-50 text-blue-700",
  "Website Form": "bg-purple-50 text-purple-700",
  "Referral": "bg-green-50 text-green-700",
  "Cold Email": "bg-orange-50 text-orange-700",
  "Instagram": "bg-pink-50 text-pink-700",
};

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  project_type: string | null;
  budget_range: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const deleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      alert("Error deleting lead: " + error.message);
    } else {
      setLeads((current) => current.filter((l) => l.id !== id));
    }
    setMenuOpenId(null);
  };

  useEffect(() => {
    async function fetchLeads() {
      const supabase = createClient();
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (data) {
        setLeads(data);
      } else {
        console.error("Error fetching leads:", error);
      }
    }
    fetchLeads();
  }, []);

  const filtered = leads.filter((lead) => {
    const searchString = `${lead.first_name ?? ""} ${lead.last_name ?? ""} ${lead.company ?? ""} ${lead.email ?? ""} ${lead.phone ?? ""} ${lead.project_type ?? ""} ${lead.budget_range ?? ""} ${lead.source ?? ""} ${lead.status ?? ""}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Leads</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{filtered.length} leads total</p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 rounded-lg bg-[#ED711D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D4611A] active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB]" />
          <input
            type="text"
            placeholder="Search leads by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#161616] placeholder-[#ABABAB] focus:border-[#ED711D] focus:outline-none focus:ring-2 focus:ring-[#ED711D]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "new", "contacted", "qualified", "converted", "lost"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? "bg-[#ED711D] text-white shadow-sm"
                  : "border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5]"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm pb-16">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#E8E8E8] bg-[#FAFAFA]">
              {["Name", "Company", "Project Type", "Approx Budget", "Source", "Status", "Added", ""].map((col, idx, arr) => (
                <th
                  key={col}
                  className={`px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === arr.length - 1 ? 'rounded-tr-xl' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {["Name", "Company", "Added"].includes(col) && (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-[#D0D0D0]" />
                    <p className="text-sm font-medium text-[#6B6B6B]">No leads found</p>
                    <p className="text-xs text-[#ABABAB]">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const statusInfo = statusConfig[lead.status ?? ""] ?? { label: lead.status ?? "Unknown", className: "bg-gray-100 text-gray-600 border border-gray-200" };
                return (
                  <tr key={lead.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ED711D]/10 text-xs font-bold text-[#ED711D]">
                          {(lead.first_name || lead.company || "?")[0]}
                        </div>
                        <div>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-sm font-semibold text-[#161616] hover:text-[#ED711D] transition-colors flex items-center gap-1 group-hover:underline"
                          >
                            {lead.first_name} {lead.last_name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60" />
                          </Link>
                          <p className="text-xs text-[#ABABAB]">{lead.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#3D3D3D] font-medium">{lead.company}</td>
                    <td className="px-5 py-4 text-sm text-[#6B6B6B]">{lead.project_type}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#3D3D3D]">{lead.budget_range}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceConfig[lead.source ?? ""] ?? "bg-gray-50 text-gray-600"}`}>
                        {lead.source || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#ABABAB]">{new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-4 text-right relative">
                      <button 
                        onClick={() => setMenuOpenId(menuOpenId === lead.id ? null : lead.id)}
                        className="rounded-md p-1.5 text-[#ABABAB] hover:bg-[#F0F0F0] hover:text-[#161616] transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpenId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-5 mt-1 w-32 rounded-lg border border-[#E8E8E8] bg-white p-1 shadow-lg z-20">
                            <Link 
                              href={`/leads/${lead.id}`}
                              className="flex w-full items-center px-3 py-2 text-xs font-medium text-[#161616] hover:bg-[#F5F5F5] rounded-md transition-colors"
                            >
                              View / Edit
                            </Link>
                            <button 
                              onClick={() => deleteLead(lead.id)}
                              className="flex w-full items-center px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
