"use client";
import { config } from "@/lib/config";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Kanban,
  FolderGit2,
  Settings,
  BarChart2,
  ChevronRight,
  Bell,
  Search,
  HelpCircle,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: UserCircle },
  { name: "Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Projects", href: "/projects", icon: FolderGit2 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoadingUser(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-[#E8E8E8] bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#E8E8E8] px-5">
        <img src={config.brand.logoUrl} alt={config.brand.name} className="h-8 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
          Main Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#ED711D]/10 text-[#ED711D]"
                      : "text-[#3D3D3D] hover:bg-[#F5F5F5] hover:text-[#161616]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${
                      isActive ? "text-[#ED711D]" : "text-[#6B6B6B] group-hover:text-[#161616]"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 text-[#ED711D]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E8E8E8] p-4">
        <div className="group flex items-center justify-between rounded-md px-2 py-2 hover:bg-[#F5F5F5] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ED711D] text-xs font-bold text-white uppercase">
              {isLoadingUser ? "..." : (user?.email?.[0] || "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#161616]">
                {isLoadingUser ? "Loading..." : (user?.user_metadata?.full_name || user?.user_metadata?.name || "Dev User")}
              </p>
              <p className="truncate text-[10px] text-[#6B6B6B]">{isLoadingUser ? "Loading..." : (user?.email || "dev@crm.local")}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-[#6B6B6B] hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<Array<{ id: string; type: string; title: string; subtitle: string; href: string }>>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; subtitle: string; href: string }>>([]);
  const currentPage = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    async function loadSearchResults() {
      if (!isSearchOpen) return;

      const [leadResult, projectResult, contactResult] = await Promise.all([
        supabase.from("leads").select("id, first_name, last_name, company, email, project_type, budget_range, status").limit(20),
        supabase.from("projects").select("id, project_name, project_ref, project_type").limit(20),
        supabase.from("contacts").select("id, first_name, last_name, company, email").limit(20),
      ]);

      setGlobalResults([
        ...(leadResult.data ?? []).map((lead) => ({
          id: `lead-${lead.id}`,
          type: "Lead",
          title: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.company || "Unnamed lead",
          subtitle: [lead.company, lead.project_type, lead.budget_range, lead.status].filter(Boolean).join(" · "),
          href: `/leads/${lead.id}`,
        })),
        ...(projectResult.data ?? []).map((project) => ({
          id: `project-${project.id}`,
          type: "Project",
          title: project.project_name,
          subtitle: [project.project_ref, project.project_type].filter(Boolean).join(" · "),
          href: `/projects/${project.id}`,
        })),
        ...(contactResult.data ?? []).map((contact) => ({
          id: `contact-${contact.id}`,
          type: "Contact",
          title: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.company || "Unnamed contact",
          subtitle: [contact.company, contact.email].filter(Boolean).join(" · "),
          href: "/contacts",
        })),
      ]);
    }

    void loadSearchResults();
  }, [isSearchOpen, supabase]);

  useEffect(() => {
    async function loadNotifications() {
      const now = new Date().toISOString();
      const { data: dueLeads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, company, follow_up_at")
        .lte("follow_up_at", now)
        .order("follow_up_at", { ascending: true })
        .limit(8);

      setNotifications(
        (dueLeads ?? []).map((lead) => ({
          id: lead.id,
          title: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.company || "Unnamed lead",
          subtitle: lead.follow_up_at ? `Follow-up due ${new Date(lead.follow_up_at).toLocaleString()}` : "Follow-up due",
          href: `/leads/${lead.id}`,
        }))
      );
    }

    void loadNotifications();
  }, [supabase]);

  const visibleResults = globalResults.filter((result) => {
    const haystack = `${result.type} ${result.title} ${result.subtitle}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }).slice(0, 10);

  const openResult = (href: string) => {
    setIsSearchOpen(false);
    setSearch("");
    router.push(href);
  };

  return (
    <header className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-[#161616]">
          {currentPage?.name ?? "CRM"}
        </h1>
        <p className="text-xs text-[#6B6B6B]">
          {config.brand.name} · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setIsSearchOpen(true)} className="flex h-9 items-center gap-2 rounded-md border border-[#E8E8E8] bg-white px-3 text-sm text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Quick search...</span>
          <span className="hidden sm:inline text-xs text-[#ABABAB] border border-[#E8E8E8] rounded px-1">⌘K</span>
        </button>
        <button onClick={() => setIsNotificationsOpen((current) => !current)} className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors">
          <Bell className="h-4 w-4 text-[#6B6B6B]" />
          {notifications.length ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ED711D]" /> : null}
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors">
          <HelpCircle className="h-4 w-4 text-[#6B6B6B]" />
        </button>
      </div>

      {isNotificationsOpen ? (
        <div className="absolute right-16 top-14 z-30 w-80 overflow-hidden rounded-lg border border-[#E8E8E8] bg-white shadow-lg">
          <div className="border-b border-[#E8E8E8] px-4 py-3">
            <p className="text-sm font-semibold text-[#161616]">Notifications</p>
          </div>
          {notifications.length ? (
            <div className="divide-y divide-[#F0F0F0]">
              {notifications.map((item) => (
                <button key={item.id} onClick={() => { setIsNotificationsOpen(false); router.push(item.href); }} className="block w-full px-4 py-3 text-left hover:bg-[#FAFAFA]">
                  <p className="text-sm font-medium text-[#161616]">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[#6B6B6B]">{item.subtitle}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-[#6B6B6B]">No notifications right now.</div>
          )}
        </div>
      ) : null}

      {isSearchOpen ? (
        <div className="fixed inset-0 z-40 bg-black/20 px-4 pt-24" onMouseDown={() => setIsSearchOpen(false)}>
          <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[#E8E8E8] px-4 py-3">
              <Search className="h-4 w-4 text-[#6B6B6B]" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads, projects, contacts..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#161616] outline-none placeholder:text-[#ABABAB]"
              />
              <button onClick={() => setIsSearchOpen(false)} className="rounded p-1 text-[#6B6B6B] hover:bg-[#F5F5F5]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {visibleResults.length ? (
                visibleResults.map((result) => (
                  <button key={result.id} onClick={() => openResult(result.href)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[#FAFAFA]">
                    <span className="w-16 shrink-0 rounded bg-[#F5F5F5] px-2 py-1 text-center text-[10px] font-semibold uppercase text-[#6B6B6B]">{result.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#161616]">{result.title}</span>
                      <span className="block truncate text-xs text-[#6B6B6B]">{result.subtitle || "No details"}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-[#6B6B6B]">No matching records found.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F7]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
