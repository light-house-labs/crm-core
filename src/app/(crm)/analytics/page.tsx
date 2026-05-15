"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, DollarSign, Activity, Target } from "lucide-react";
import { config } from "@/lib/config";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    totalProjects: 0,
    totalRevenue: 0,
    winRate: 0,
    sourceData: [] as Array<{ name: string; value: number }>,
    revenueData: [] as Array<{ month: string; revenue: number }>,
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#ED711D', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      
      const { data: leads } = await supabase.from("leads").select("status, source");
      const { data: projects } = await supabase.from("projects").select("total_budget, created_at, launch_date");
      
      const totalLeads = leads?.length || 0;
      const wonStageId = config.pipeline.stages.find(stage => stage.id === "won")?.id || "converted";
      const convertedLeads = leads?.filter(l => l.status === wonStageId || l.status === "converted").length || 0;
      const lostLeads = leads?.filter(l => l.status === "lost").length || 0;
      const closedLeads = convertedLeads + lostLeads;
      const winRate = closedLeads > 0 ? Math.round((convertedLeads / closedLeads) * 100) : 0;
      
      const totalProjects = projects?.length || 0;
      const totalRevenue = projects?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0;

      // Calculate Lead Sources
      const sourceCount: Record<string, number> = {};
      leads?.forEach(lead => {
        const source = lead.source || 'Other';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      const sourceData = Object.keys(sourceCount).map(key => ({
        name: key,
        value: sourceCount[key]
      })).sort((a, b) => b.value - a.value);

      // Dummy Revenue Forecast (Next 3 months based on projects)
      // In a real scenario, this would group project totals by launch month
      const currentMonth = new Date().getMonth();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const revenueData = [
        { month: monthNames[(currentMonth) % 12], revenue: totalRevenue * 0.4 },
        { month: monthNames[(currentMonth + 1) % 12], revenue: totalRevenue * 0.35 },
        { month: monthNames[(currentMonth + 2) % 12], revenue: totalRevenue * 0.25 },
      ];

      setStats({
        totalLeads,
        convertedLeads,
        totalProjects,
        totalRevenue,
        winRate,
        sourceData,
        revenueData
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-[#161616]">Analytics</h2>
        <p className="text-sm text-[#6B6B6B] mt-0.5">High-level overview of your CRM performance.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#ABABAB]">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Total Leads</p>
                  <p className="mt-2 text-2xl font-bold text-[#161616]">{stats.totalLeads}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Win Rate</p>
                  <p className="mt-2 text-2xl font-bold text-[#161616]">{stats.winRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Active Projects</p>
                  <p className="mt-2 text-2xl font-bold text-[#161616]">{stats.totalProjects}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ED711D]/10 text-[#ED711D]">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Pipeline Value</p>
                  <p className="mt-2 text-2xl font-bold text-[#161616]">{config.localization.currencySymbol}{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#161616] mb-6">Lead Sources Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${Number(value ?? 0)} Leads`, 'Count']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E8E8E8', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#161616] mb-6">Revenue Forecast</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6B6B6B' }}
                      tickFormatter={(value) => `${config.localization.currencySymbol}${Number(value) / 1000}k`}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F5F5F5' }}
                      formatter={(value) => [`${config.localization.currencySymbol}${Number(value ?? 0).toLocaleString()}`, 'Forecast']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E8E8E8', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey="revenue" fill="#ED711D" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
