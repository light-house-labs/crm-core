"use client";
import { config } from "@/lib/config";
import { useState, useEffect } from "react";
import { Clock, DollarSign, AlertCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type PipelineLead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  project_type: string | null;
  budget_range: string | null;
  status: string | null;
  created_at: string;
  daysContact: number;
};

function DaysIndicator({ days }: { days: number }) {
  if (days > 14) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
      <AlertCircle className="h-3 w-3" />{days}d
    </span>
  );
  if (days > 7) return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
      <Clock className="h-3 w-3" />{days}d
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#ABABAB]">
      <Clock className="h-3 w-3" />{days}d
    </span>
  );
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      const supabase = createClient();
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (data) {
        // Mock daysContact for now since it's not directly in DB
        const leadsWithDays = data.map((l) => {
          const days = Math.floor((new Date().getTime() - new Date(l.created_at).getTime()) / (1000 * 3600 * 24));
          return { ...l, daysContact: days };
        });
        setLeads(leadsWithDays);
      }
    }
    fetchLeads();
  }, []);

  const handleDragStart = (id: string) => setDragging(id);

  const handleDrop = async (stageId: string) => {
    if (!dragging) return;
    
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === dragging ? { ...l, status: stageId } : l))
    );
    
    // Background DB update
    const supabase = createClient();
    await supabase.from("leads").update({ status: stageId }).eq("id", dragging);
    
    setDragging(null);
  };

  return (
    <div className="flex h-full flex-col space-y-5">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Pipeline</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{leads.length} leads across {config.pipeline.stages.length} stages</p>
        </div>
        <Link href="/leads/new" className="flex items-center gap-2 rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm font-medium text-[#3D3D3D] hover:bg-[#F5F5F5] transition-colors shadow-sm">
          <Plus className="h-4 w-4" />
          Add Lead
        </Link>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
        {config.pipeline.stages.map((stage) => {
          const columnLeads = leads.filter((l) => l.status === stage.id);
          return (
            <div
              key={stage.id}
              className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-[#E8E8E8] bg-[#F7F7F7] overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Column Header */}
              <div className="border-b border-[#E8E8E8] bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: "#ED711D", backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold text-[#161616]">{stage.label}</span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ED711D]/10 text-[10px] font-bold text-[#ED711D]">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3 min-h-32">
                {columnLeads.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[#E0E0E0] py-6">
                    <p className="text-xs text-[#ABABAB]">Drop leads here</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className={`cursor-grab rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-sm hover:shadow-md active:cursor-grabbing active:opacity-70 transition-all ${dragging === lead.id ? "opacity-50 scale-95" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#ED711D]/10 text-xs font-bold text-[#ED711D]">
                            {(lead.first_name || lead.company || "?")[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#161616] truncate">{lead.company}</p>
                            <p className="text-[10px] text-[#6B6B6B] truncate">{lead.first_name} {lead.last_name}</p>
                          </div>
                        </div>
                        <DaysIndicator days={lead.daysContact} />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-md bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-medium text-[#6B6B6B]">
                          {lead.project_type}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#3D3D3D]">
                          <DollarSign className="h-2.5 w-2.5 text-green-600" />
                          {lead.budget_range}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
