"use client";
import { config } from "@/lib/config";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPipeline() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.from("leads").select("*");
      if (data) setLeads(data);
      setLoading(false);
    }
    fetchPipeline();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pipeline</h1>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {config.pipeline.stages.map((stage) => {
          const columnLeads = leads.filter((l) => l.status === stage.id);
          
          return (
            <div key={stage.id} className="flex w-80 flex-shrink-0 flex-col rounded-xl bg-gray-100 p-4 dark:bg-gray-800/50">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{stage.label}</h3>
                </div>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {columnLeads.length}
                </span>
              </div>
              
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {loading ? (
                  <div className="animate-pulse rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900 h-24" />
                ) : columnLeads.length === 0 ? (
                  <div className="text-sm text-gray-500 italic px-2">No leads in this stage</div>
                ) : (
                  columnLeads.map((lead) => (
                    <div key={lead.id} className="cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900">
                      <p className="font-medium text-gray-900 dark:text-white">{lead.company || `${lead.first_name} ${lead.last_name}`}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{lead.project_type || "No project type"}</span>
                        <span className="font-medium">{lead.budget_range || "-"}</span>
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
