"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, Search, Briefcase, Calendar, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const phaseConfig: Record<string, { label: string; color: string }> = {
  discovery: { label: "Discovery", color: "bg-purple-100 text-purple-700" },
  design: { label: "Design", color: "bg-blue-100 text-blue-700" },
  build: { label: "Build", color: "bg-amber-100 text-amber-700" },
  review: { label: "Review", color: "bg-orange-100 text-orange-700" },
  launch: { label: "Launch", color: "bg-green-100 text-green-700" },
  live: { label: "Live", color: "bg-emerald-100 text-emerald-700" },
};

const statusConfig: Record<string, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-green-500" },
  on_hold: { label: "On Hold", dot: "bg-amber-500" },
  completed: { label: "Completed", dot: "bg-blue-500" },
  cancelled: { label: "Cancelled", dot: "bg-red-500" },
};

type ProjectRow = {
  id: string;
  project_name: string;
  project_ref: string | null;
  project_type: string | null;
  phase: string | null;
  status: string | null;
  completion_pct: number | null;
  launch_date: string | null;
  contacts: {
    first_name: string | null;
    last_name: string | null;
    company: string | null;
  } | null;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const deleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      alert("Error deleting project: " + error.message);
    } else {
      setProjects((current) => current.filter((p) => p.id !== id));
    }
    setMenuOpenId(null);
  };

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("*, contacts(first_name, last_name, company)").order("created_at", { ascending: false });
      if (data) setProjects(data);
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const filtered = projects.filter((project) => {
    const searchString = `${project.project_name ?? ""} ${project.project_ref ?? ""} ${project.contacts?.company ?? ""} ${project.project_type ?? ""} ${project.phase ?? ""} ${project.status ?? ""}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Projects</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{filtered.length} active projects</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-[#ED711D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D4611A] active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB]" />
          <input
            type="text"
            placeholder="Search projects by name, ref, or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#161616] placeholder-[#ABABAB] focus:border-[#ED711D] focus:outline-none focus:ring-2 focus:ring-[#ED711D]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "discovery", "design", "build", "review", "launch", "live"].map((p) => (
            <button
              key={p}
              onClick={() => setPhaseFilter(p)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all ${
                phaseFilter === p
                  ? "bg-[#161616] text-white shadow-sm"
                  : "border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:bg-[#F5F5F5]"
              }`}
            >
              {p === "all" ? "All Phases" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#ABABAB]">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E8E8]">
          <Briefcase className="h-12 w-12 text-[#E8E8E8] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#161616]">No projects found</p>
          <p className="text-sm text-[#6B6B6B]">Convert a lead or create a project manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => {
            const phase = phaseConfig[project.phase ?? ""] || { label: project.phase || "Unknown", color: "bg-gray-100 text-gray-700" };
            const status = statusConfig[project.status ?? ""] || { label: project.status || "Unknown", dot: "bg-gray-400" };
            const progress = project.completion_pct || 0;

            return (
              <Link href={`/projects/${project.id}`} key={project.id} className="group flex flex-col rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#ABABAB]">{project.project_ref}</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#6B6B6B]">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#161616] truncate group-hover:text-[#ED711D] transition-colors">{project.project_name}</h3>
                    <p className="text-xs text-[#6B6B6B] truncate">{project.contacts?.company || "No Client Assigned"}</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${phase.color}`}>
                      {phase.label}
                    </span>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                      className="rounded-md p-1.5 text-[#ABABAB] hover:bg-[#E8E8E8] hover:text-[#161616] transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpenId === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(null); }} />
                        <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-[#E8E8E8] bg-white p-1 shadow-lg z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteProject(project.id); }}
                            className="flex w-full items-center px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Delete Project
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#E8E8E8]">
                  <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-2">
                    <span className="font-medium text-[#161616]">{progress}% Complete</span>
                    {project.launch_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(project.launch_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#161616] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
