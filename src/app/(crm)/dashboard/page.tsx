"use client";
import { config } from "@/lib/config";
import { Users, DollarSign, Target, Calendar } from "lucide-react";

export default function DashboardPage() {
  const mockMetrics = [
    { title: "Leads this month", value: "24", change: "+12%", icon: Users },
    { title: "Pipeline Value", value: "$45,000", change: "+5%", icon: DollarSign },
    { title: "Win Rate", value: "32%", change: "+2%", icon: Target },
    { title: "Follow-ups due", value: "5", change: "None missed", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to {config.brand.name} CRM</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {mockMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="font-medium text-green-600 dark:text-green-400">{metric.change}</span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity feed</h2>
          <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500">Activity schema not yet populated mock data</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Follow-ups</h2>
          <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500">No follow-up leads configured yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
