"use client";

import { useEffect, useMemo, useState } from "react";
import { config } from "@/lib/config";
import { CrmOptionCategory, CrmOptions, crmOptionLabels, defaultCrmOptions, fetchCrmOptions } from "@/lib/crm-options";
import { createClient } from "@/lib/supabase/client";
import { Bell, Building, ExternalLink, Loader2, LogOut, Plus, Shield, Trash2, User } from "lucide-react";

type SettingsSection = "workspace" | "profile" | "security" | "notifications";

type NotificationPreferences = {
  dailyDigest: boolean;
  leadAlerts: boolean;
  pipelineReminders: boolean;
};

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
};

const notificationStorageKey = "crm-core:notification-preferences";

const defaultNotificationPreferences: NotificationPreferences = {
  dailyDigest: true,
  leadAlerts: true,
  pipelineReminders: false,
};

const sectionButtons: Array<{
  id: SettingsSection;
  label: string;
  icon: typeof Building;
}> = [
  { id: "workspace", label: "Workspace", icon: Building },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const formatFeatureLabel = (key: string) => key.replace(/([A-Z])/g, " $1").trim();

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [activeSection, setActiveSection] = useState<SettingsSection>("workspace");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [authProvider, setAuthProvider] = useState("google");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [crmOptions, setCrmOptions] = useState<CrmOptions>(defaultCrmOptions);
  const [optionInputs, setOptionInputs] = useState<Record<CrmOptionCategory, string>>({
    project_type: "",
    budget_range: "",
    timeline: "",
  });
  const [isSavingOption, setIsSavingOption] = useState<CrmOptionCategory | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamForm, setTeamForm] = useState({ name: "", email: "", role: "member" });
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingProfile(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        if (authError.message.includes("Auth session missing")) {
          // Gracefully fallback for local dev where middleware bypasses auth
          setProfileName("Dev User");
          setProfileEmail("dev@crm.local");
          setUserRole("admin");
          setIsLoadingProfile(false);
          return;
        }
        setStatusTone("error");
        setStatusMessage(authError.message);
        setIsLoadingProfile(false);
        return;
      }

      const user = authData.user;

      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      setProfileEmail(user.email ?? "");
      setProfileName(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          ""
      );
      setAuthProvider(user.app_metadata?.provider ?? "google");

      const { data: allowedUser } = await supabase
        .from("allowed_users")
        .select("role, name")
        .eq("email", user.email ?? "")
        .maybeSingle();

      if (allowedUser?.role) {
        setUserRole(allowedUser.role);
      }

      if (allowedUser?.name && !user.user_metadata?.full_name && !user.user_metadata?.name) {
        setProfileName(allowedUser.name);
      }

      const [{ data: users }, optionsResult] = await Promise.all([
        supabase.from("allowed_users").select("id, name, email, role").order("added_at", { ascending: false }),
        fetchCrmOptions(supabase),
      ]);

      if (users) {
        setTeamMembers(users);
      }

      setCrmOptions(optionsResult.options);

      if (optionsResult.error) {
        showStatus("error", "CRM option settings need the latest database migration before they can be saved.");
      }

      const savedPreferences = window.localStorage.getItem(notificationStorageKey);

      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences) as NotificationPreferences;
          setNotificationPreferences({
            dailyDigest: Boolean(parsed.dailyDigest),
            leadAlerts: Boolean(parsed.leadAlerts),
            pipelineReminders: Boolean(parsed.pipelineReminders),
          });
        } catch {
          window.localStorage.removeItem(notificationStorageKey);
        }
      }

      setIsLoadingProfile(false);
    };

    void loadSettings();
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(notificationStorageKey, JSON.stringify(notificationPreferences));
  }, [notificationPreferences]);

  const showStatus = (tone: "success" | "error", message: string) => {
    setStatusTone(tone);
    setStatusMessage(message);
  };

  const refreshCrmOptions = async () => {
    const optionsResult = await fetchCrmOptions(supabase);
    setCrmOptions(optionsResult.options);

    if (optionsResult.error) {
      showStatus("error", optionsResult.error);
    }

    return optionsResult;
  };

  const saveProfile = async () => {
    if (!profileName.trim()) {
      showStatus("error", "Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { full_name: profileName.trim() },
    });

    if (authUpdateError) {
      setIsSavingProfile(false);
      showStatus("error", authUpdateError.message);
      return;
    }

    const { error: allowedUserError } = await supabase
      .from("allowed_users")
      .update({ name: profileName.trim() })
      .eq("email", profileEmail);

    setIsSavingProfile(false);

    if (allowedUserError) {
      showStatus(
        "error",
        "Your auth profile was updated, but the allowed users table could not be updated."
      );
      return;
    }

    showStatus("success", "Profile updated successfully.");
  };

  const signOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      showStatus("error", error.message);
      return;
    }

    window.location.href = "/login";
  };

  const addCrmOption = async (category: CrmOptionCategory) => {
    const value = optionInputs[category].trim();

    if (!value) {
      showStatus("error", `${crmOptionLabels[category]} cannot be empty.`);
      return;
    }

    if (crmOptions[category].some((option) => option.toLowerCase() === value.toLowerCase())) {
      showStatus("error", `${value} already exists.`);
      return;
    }

    setIsSavingOption(category);
    const { error } = await supabase
      .from("crm_options")
      .insert({
        category,
        value,
        position: crmOptions[category].length + 1,
      })
      .select("id")
      .single();
    setIsSavingOption(null);

    if (error) {
      showStatus("error", error.message);
      return;
    }

    await refreshCrmOptions();
    setOptionInputs((current) => ({ ...current, [category]: "" }));
    showStatus("success", `${crmOptionLabels[category]} option added.`);
  };

  const deleteCrmOption = async (category: CrmOptionCategory, value: string) => {
    const { error } = await supabase.from("crm_options").delete().eq("category", category).eq("value", value);

    if (error) {
      showStatus("error", error.message);
      return;
    }

    await refreshCrmOptions();
    showStatus("success", `Option "${value}" removed.`);
  };

  const addTeamMember = async () => {
    const email = teamForm.email.trim().toLowerCase();
    const name = teamForm.name.trim();

    if (!email) {
      showStatus("error", "Email cannot be empty.");
      return;
    }

    setIsAddingTeamMember(true);
    const { data, error } = await supabase
      .from("allowed_users")
      .insert({ email, name: name || null, role: teamForm.role })
      .select("id, name, email, role")
      .single();
    setIsAddingTeamMember(false);

    if (error) {
      showStatus("error", error.message);
      return;
    }

    setTeamMembers((current) => [data, ...current]);
    setTeamForm({ name: "", email: "", role: "member" });
    showStatus("success", "Team member added. They can now be assigned to leads and projects.");
  };

  const deleteTeamMember = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this person?")) return;
    const { error } = await supabase.from("allowed_users").delete().eq("id", id);
    if (error) {
      showStatus("error", error.message);
      return;
    }
    setTeamMembers((current) => current.filter((m) => m.id !== id));
    showStatus("success", "Team member removed.");
  };

  const renderWorkspaceSection = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E8E8E8] px-6 py-4">
          <h3 className="text-base font-semibold text-[#161616]">Tenant Configuration</h3>
          <p className="mt-1 text-xs text-[#6B6B6B]">
            These values come from <code>tenant.config.ts</code>. You do not need to set the brand
            colors unless you want custom branding.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
                Brand Name
              </label>
              <input
                type="text"
                disabled
                value={config.brand.name}
                className="w-full rounded border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 text-sm text-[#6B6B6B]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
                Support Email
              </label>
              <input
                type="text"
                disabled
                value={config.brand.supportEmail}
                className="w-full rounded border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 text-sm text-[#6B6B6B]"
              />
            </div>

          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E8E8E8] px-6 py-4">
          <h3 className="text-base font-semibold text-[#161616]">Lead & Project Options</h3>
          <p className="mt-1 text-xs text-[#6B6B6B]">
            Add selectable values for project type, approximate budget, and timeline fields.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#F0F0F0] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {(["project_type", "budget_range", "timeline"] as CrmOptionCategory[]).map((category) => (
            <div key={category} className="p-5">
              <h4 className="text-sm font-semibold text-[#161616]">{crmOptionLabels[category]}</h4>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={optionInputs[category]}
                  onChange={(event) =>
                    setOptionInputs((current) => ({ ...current, [category]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addCrmOption(category);
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
                  placeholder={`Add ${crmOptionLabels[category].toLowerCase()}`}
                />
                <button
                  type="button"
                  onClick={() => void addCrmOption(category)}
                  disabled={isSavingOption === category}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#ED711D] text-white transition hover:bg-[#D96314] disabled:opacity-60"
                  aria-label={`Add ${crmOptionLabels[category]}`}
                >
                  {isSavingOption === category ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {crmOptions[category].map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-[#161616]">{option}</span>
                    <button
                      type="button"
                      onClick={() => void deleteCrmOption(category, option)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#6B6B6B] transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${option}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E8E8E8] px-6 py-4">
          <h3 className="text-base font-semibold text-[#161616]">Assignable People</h3>
          <p className="mt-1 text-xs text-[#6B6B6B]">
            Add people who can be selected in Assigned To fields for leads and projects.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
            <input
              type="text"
              value={teamForm.name}
              onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
              placeholder="Name"
            />
            <input
              type="email"
              value={teamForm.email}
              onChange={(event) => setTeamForm((current) => ({ ...current, email: event.target.value }))}
              className="rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
              placeholder="Email"
            />
            <select
              value={teamForm.role}
              onChange={(event) => setTeamForm((current) => ({ ...current, role: event.target.value }))}
              className="rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="button"
              onClick={() => void addTeamMember()}
              disabled={isAddingTeamMember}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ED711D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D96314] disabled:opacity-60"
            >
              {isAddingTeamMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="divide-y divide-[#F0F0F0] rounded-lg border border-[#E8E8E8]">
            {teamMembers.length ? (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#161616]">{member.name || member.email}</p>
                    <p className="truncate text-xs text-[#6B6B6B]">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F4F4F5] px-3 py-1 text-xs font-semibold capitalize text-[#6B6B6B]">
                      {member.role || "member"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteTeamMember(member.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#6B6B6B] transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove person"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[#6B6B6B]">No assignable people yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E8E8E8] px-6 py-4">
          <h3 className="text-base font-semibold text-[#161616]">Feature Flags</h3>
          <p className="mt-1 text-xs text-[#6B6B6B]">
            These are read-only here and controlled by <code>tenant.config.ts</code>.
          </p>
        </div>
        <div className="p-6 divide-y divide-[#F0F0F0]">
          {Object.entries(config.features).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-[#161616]">{formatFeatureLabel(key)}</p>
                <p className="text-xs text-[#6B6B6B]">
                  {enabled ? "Enabled in the current tenant config." : "Disabled in the current tenant config."}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  enabled ? "bg-[#FFF0E5] text-[#B45309]" : "bg-[#F4F4F5] text-[#6B6B6B]"
                }`}
              >
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#E8E8E8] px-6 py-4">
        <h3 className="text-base font-semibold text-[#161616]">Profile</h3>
        <p className="mt-1 text-xs text-[#6B6B6B]">
          Update your personal name. Your email address stays tied to your Google account.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
              Full Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              className="w-full rounded border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#161616] outline-none transition focus:border-[#ED711D]"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
              Email
            </label>
            <input
              type="email"
              disabled
              value={profileEmail}
              className="w-full rounded border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 text-sm text-[#6B6B6B]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
              Role
            </label>
            <input
              type="text"
              disabled
              value={userRole}
              className="w-full rounded border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 text-sm capitalize text-[#6B6B6B]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#ABABAB]">
              Authentication Provider
            </label>
            <input
              type="text"
              disabled
              value={authProvider}
              className="w-full rounded border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-2 text-sm capitalize text-[#6B6B6B]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveProfile}
            disabled={isSavingProfile || isLoadingProfile}
            className="inline-flex items-center gap-2 rounded-md bg-[#ED711D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#D96314] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#E8E8E8] px-6 py-4">
        <h3 className="text-base font-semibold text-[#161616]">Security</h3>
        <p className="mt-1 text-xs text-[#6B6B6B]">
          This workspace uses Google sign-in, so password and MFA changes are handled in your Google account.
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] p-4">
          <p className="text-sm font-medium text-[#161616]">Current provider</p>
          <p className="mt-1 text-sm capitalize text-[#6B6B6B]">{authProvider}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-semibold text-[#161616] transition hover:bg-[#F7F7F7]"
          >
            Google Security
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-2 rounded-md bg-[#161616] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#E8E8E8] px-6 py-4">
        <h3 className="text-base font-semibold text-[#161616]">Notifications</h3>
        <p className="mt-1 text-xs text-[#6B6B6B]">
          These preferences are saved in this browser for now. If you want them synced across devices, we will need a database table for notification settings.
        </p>
      </div>

      <div className="p-6 divide-y divide-[#F0F0F0]">
        {[
          {
            key: "dailyDigest" as const,
            label: "Daily Digest",
            description: "Show a daily summary preference for this browser.",
          },
          {
            key: "leadAlerts" as const,
            label: "Lead Alerts",
            description: "Keep browser-level lead notification preferences.",
          },
          {
            key: "pipelineReminders" as const,
            label: "Pipeline Reminders",
            description: "Store reminder preferences for follow-ups in this browser.",
          },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-[#161616]">{item.label}</p>
              <p className="text-xs text-[#6B6B6B]">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setNotificationPreferences((current) => ({
                  ...current,
                  [item.key]: !current[item.key],
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                notificationPreferences[item.key] ? "bg-[#ED711D]" : "bg-[#E8E8E8]"
              }`}
              aria-pressed={notificationPreferences[item.key]}
              aria-label={item.label}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  notificationPreferences[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveSection = () => {
    if (isLoadingProfile) {
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#E8E8E8] bg-white shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings...
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "security":
        return renderSecuritySection();
      case "notifications":
        return renderNotificationsSection();
      case "workspace":
      default:
        return renderWorkspaceSection();
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-[#161616]">Settings</h2>
        <p className="mt-0.5 text-sm text-[#6B6B6B]">
          Manage your CRM preferences and tenant configuration.
        </p>
      </div>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusTone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-1">
          {sectionButtons.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-[#F5F5F5] font-semibold text-[#161616]"
                    : "font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#161616]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6 md:col-span-3">{renderActiveSection()}</div>
      </div>
    </div>
  );
}
