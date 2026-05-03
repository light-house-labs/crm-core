import { config } from "@/lib/config";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CrmOptionCategory = "project_type" | "budget_range" | "timeline";

export type CrmOption = {
  id: string;
  category: CrmOptionCategory;
  value: string;
  position: number;
};

export type CrmOptions = Record<CrmOptionCategory, string[]>;

export const crmOptionLabels: Record<CrmOptionCategory, string> = {
  project_type: "Project Type",
  budget_range: "Approx Budget",
  timeline: "Timeline",
};

export const defaultCrmOptions: CrmOptions = {
  project_type: config.leads.projectTypes,
  budget_range: config.leads.budgetRanges,
  timeline: config.leads.timelines,
};

export async function fetchCrmOptions(supabase: SupabaseClient): Promise<{
  options: CrmOptions;
  rows: CrmOption[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("crm_options")
    .select("id, category, value, position")
    .order("position", { ascending: true })
    .order("value", { ascending: true });

  if (error) {
    return {
      options: defaultCrmOptions,
      rows: [],
      error: error.message,
    };
  }

  const nextOptions: CrmOptions = {
    project_type: [],
    budget_range: [],
    timeline: [],
  };

  for (const option of (data ?? []) as CrmOption[]) {
    if (option.category in nextOptions) {
      nextOptions[option.category].push(option.value);
    }
  }

  return {
    options: {
      project_type: nextOptions.project_type.length ? nextOptions.project_type : defaultCrmOptions.project_type,
      budget_range: nextOptions.budget_range.length ? nextOptions.budget_range : defaultCrmOptions.budget_range,
      timeline: nextOptions.timeline.length ? nextOptions.timeline : defaultCrmOptions.timeline,
    },
    rows: (data ?? []) as CrmOption[],
    error: null,
  };
}
