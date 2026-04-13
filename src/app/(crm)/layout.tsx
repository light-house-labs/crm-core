"use client";
import { config } from "@/lib/config";
import Image from "next/image";
import { LayoutDashboard, Users, UserCircle, Kanban, FolderGit2, Settings, BarChart2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: UserCircle },
    { name: "Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Contacts", href: "/contacts", icon: Users },
  ];

  if (config.features.analytics) {
    navItems.push({ name: "Analytics", href: "/analytics", icon: BarChart2 });
  }
  
  navItems.push({ name: "Settings", href: "/settings", icon: Settings });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          {config.brand.logoUrl ? (
            <div className="relative h-8 w-full">
              <Image 
                src={config.brand.logoUrl} 
                alt={config.brand.name} 
                fill 
                className="object-contain object-left"
                unoptimized
              />
            </div>
          ) : (
            <span className="text-lg font-bold text-primary">{config.brand.name}</span>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
