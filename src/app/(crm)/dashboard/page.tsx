"use client";

import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  follow_up_at: string | null;
  created_at: string;
};

type Project = {
  id: string;
  project_name: string;
  project_ref: string | null;
  total_budget: number | null;
  status: string | null;
  created_at: string;
};

type ActivityRow = {
  id: string;
  type: string;
  summary: string;
  created_at: string;
};

const formatRelativeTime = (dateValue: string) => {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateValue).toLocaleDateString();
};

const getLeadName = (lead: Lead) =>
  [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.company || "Unnamed lead";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [leadResult, projectResult, activityResult] = await Promise.all([
        supabase
          .from("leads")
          .select("id, first_name, last_name, company, source, status, follow_up_at, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id, project_name, project_ref, total_budget, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("activities")
          .select("id, type, summary, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (leadResult.data) setLeads(leadResult.data as Lead[]);
      if (projectResult.data) setProjects(projectResult.data as Project[]);
      if (activityResult.data) setActivities(activityResult.data as ActivityRow[]);
      setIsLoading(false);
    }

    void fetchData();
  }, []);

  const today = useMemo(() => new Date(), []);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const leadsThisMonth = leads.filter((lead) => new Date(lead.created_at) >= startOfMonth).length;
  const pipelineValue = projects
    .filter((project) => project.status !== "archived")
    .reduce((sum, project) => sum + Number(project.total_budget ?? 0), 0);
  const convertedLeads = leads.filter((lead) => lead.status === "converted").length;
  const lostLeads = leads.filter((lead) => lead.status === "lost").length;
  const closedLeads = convertedLeads + lostLeads;
  const winRate = closedLeads ? Math.round((convertedLeads / closedLeads) * 100) : 0;
  const followUpsDue = leads.filter(
    (lead) => lead.follow_up_at && new Date(lead.follow_up_at) <= endOfToday
  );
  const overdueFollowUps = followUpsDue.filter((lead) => new Date(lead.follow_up_at as string) < startOfToday);

  const metrics = [
    {
      title: "Leads This Month",
      value: leadsThisMonth.toString(),
      description: `${leads.length} total leads`,
      icon: Users,
    },
    {
      title: "Pipeline Value",
      value: `${config.localization.currencySymbol}${pipelineValue.toLocaleString()}`,
      description: "active projects",
      icon: TrendingUp,
    },
    {
      title: "Win Rate",
      value: `${winRate}%`,
      description: closedLeads ? "converted vs lost" : "no closed leads yet",
      icon: Target,
    },
    {
      title: "Follow-ups Due",
      value: followUpsDue.length.toString(),
      description: `${overdueFollowUps.length} overdue`,
      icon: Calendar,
    },
  ];

  const stageSummary = config.pipeline.stages.map((stage) => {
    const count = leads.filter((lead) => lead.status === stage.id).length;
    return { label: stage.label, count };
  });
  const totalLeads = Math.max(leads.length, 1);

  const recentItems = [
    ...activities.map((item) => ({
      id: `activity-${item.id}`,
      icon: Activity,
      color: "text-blue-500",
      text: item.summary,
      sub: item.type,
      createdAt: item.created_at,
    })),
    ...leads.slice(0, 8).map((lead) => ({
      id: `lead-${lead.id}`,
      icon: Activity,
      color: "text-blue-500",
      text: "New lead added",
      sub: `${getLeadName(lead)}${lead.source ? ` · ${lead.source}` : ""}`,
      createdAt: lead.created_at,
    })),
    ...projects.slice(0, 8).map((project) => ({
      id: `project-${project.id}`,
      icon: CheckCircle2,
      color: "text-green-500",
      text: "Project created",
      sub: project.project_ref ? `${project.project_name} · ${project.project_ref}` : project.project_name,
      createdAt: project.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const visibleFollowUps = followUpsDue
    .sort((a, b) => new Date(a.follow_up_at as string).getTime() - new Date(b.follow_up_at as string).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Good morning</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            {isLoading ? "Loading your CRM pipeline..." : "Here's what's happening in your pipeline today."}
          </p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">{metric.title}</p>
                  <p className="mt-2 text-2xl font-bold text-[#161616]">{metric.value}</p>
                </div>
                <div className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#ED711D]/10">
                  <Icon className="h-5 w-5 text-[#ED711D]" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-[#ABABAB]">{metric.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-[#E8E8E8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4">
            <h3 className="text-sm font-semibold text-[#161616]">Recent Activity</h3>
          </div>
          {recentItems.length ? (
            <ul className="divide-y divide-[#F0F0F0]">
              {recentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#161616]">{item.text}</p>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">{item.sub}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-[#ABABAB]">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(item.createdAt)}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-[#6B6B6B]">
              No activity yet. New leads and logged actions will appear here.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4">
              <h3 className="text-sm font-semibold text-[#161616]">Follow-ups Due</h3>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-100">
                {overdueFollowUps.length} overdue
              </span>
            </div>
            {visibleFollowUps.length ? (
              <ul className="divide-y divide-[#F0F0F0]">
                {visibleFollowUps.map((lead) => {
                  const dueDate = new Date(lead.follow_up_at as string);
                  const isOverdue = dueDate < startOfToday;
                  return (
                    <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#ED711D]/10 text-xs font-bold text-[#ED711D]">
                        {getLeadName(lead)[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#161616] truncate">{getLeadName(lead)}</p>
                        <p className="text-[10px] text-[#6B6B6B] truncate">{lead.company || "No company"}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                          isOverdue
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-[#F5F5F5] text-[#6B6B6B]"
                        }`}
                      >
                        {isOverdue ? "Overdue" : "Today"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-[#6B6B6B]">No follow-ups due today.</div>
            )}
          </div>

          <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm">
            <div className="border-b border-[#E8E8E8] px-5 py-4">
              <h3 className="text-sm font-semibold text-[#161616]">Pipeline by Stage</h3>
            </div>
            <div className="p-5 space-y-3">
              {stageSummary.map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-[#6B6B6B] font-medium">{stage.label}</span>
                  <div className="flex-1 rounded-full bg-[#F0F0F0] h-2">
                    <div
                      className="h-2 rounded-full bg-[#ED711D]"
                      style={{ width: `${(stage.count / totalLeads) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs font-bold text-[#161616]">{stage.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
