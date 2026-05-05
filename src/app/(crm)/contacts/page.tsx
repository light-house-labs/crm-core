"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Mail, Phone, Building, User, MoreHorizontal, ArrowUpDown, X, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Contact = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  projects?: Array<{ id: string }>;
};

const emptyContactForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  role: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      const supabase = createClient();
      // Also fetch related projects count
      const { data } = await supabase.from("contacts").select("*, projects(id)").order("created_at", { ascending: false });
      if (data) setContacts(data);
      setLoading(false);
    }
    fetchContacts();
  }, []);

  const filtered = contacts.filter((contact) => {
    const searchString = `${contact.first_name ?? ""} ${contact.last_name ?? ""} ${contact.company ?? ""} ${contact.email ?? ""} ${contact.phone ?? ""} ${contact.role ?? ""}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const saveContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!contactForm.first_name.trim() || !contactForm.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    
    const payload = {
      first_name: contactForm.first_name.trim(),
      last_name: contactForm.last_name.trim(),
      email: contactForm.email.trim() || null,
      phone: contactForm.phone.trim() || null,
      company: contactForm.company.trim() || null,
      role: contactForm.role.trim() || null,
    };

    if (editingId) {
      const { data, error: dbError } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", editingId)
        .select("*, projects(id)")
        .single();
      
      setIsSaving(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      setContacts(current => current.map(c => c.id === editingId ? data : c));
    } else {
      const { data, error: dbError } = await supabase
        .from("contacts")
        .insert(payload)
        .select("*, projects(id)")
        .single();
      
      setIsSaving(false);
      if (dbError) {
        setError(dbError.message);
        return;
      }
      setContacts((current) => [data, ...current]);
    }

    setContactForm(emptyContactForm);
    setEditingId(null);
    setIsAddOpen(false);
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    
    const supabase = createClient();
    const { error: dbError } = await supabase.from("contacts").delete().eq("id", id);
    
    if (dbError) {
      alert("Error deleting contact: " + dbError.message);
    } else {
      setContacts(current => current.filter(c => c.id !== id));
    }
    setMenuOpenId(null);
  };

  const openEdit = (contact: Contact) => {
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      role: contact.role || "",
    });
    setEditingId(contact.id);
    setIsAddOpen(true);
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#161616]">Contacts</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{filtered.length} total contacts</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#ED711D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D4611A] active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB]" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E8E8E8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#161616] placeholder-[#ABABAB] focus:border-[#ED711D] focus:outline-none focus:ring-2 focus:ring-[#ED711D]/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm pb-16 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#E8E8E8] bg-[#FAFAFA]">
              {["Name", "Company", "Contact Details", "Projects", "Added", ""].map((col, idx, arr) => (
                <th
                  key={col}
                  className={`px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === arr.length - 1 ? 'rounded-tr-xl' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col}
                    {["Name", "Company", "Added"].includes(col) && (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-[#ABABAB]">Loading contacts...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-[#D0D0D0]" />
                    <p className="text-sm font-medium text-[#6B6B6B]">No contacts found</p>
                    <p className="text-xs text-[#ABABAB]">Try adjusting your search or add a new contact.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ED711D]/10 text-xs font-bold text-[#ED711D]">
                        {(contact.first_name || contact.company || "?")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#161616] group-hover:text-[#ED711D] transition-colors cursor-pointer">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-[#ABABAB]">{contact.role || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-[#ABABAB]" />
                      <span className="text-sm text-[#3D3D3D] font-medium">{contact.company || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-[#ABABAB]" />
                      <span className="text-xs text-[#3D3D3D]"><a href={`mailto:${contact.email}`} className="hover:text-[#ED711D]">{contact.email}</a></span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-[#ABABAB]" />
                        <span className="text-xs text-[#3D3D3D]">{contact.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F5F5F5] text-xs font-bold text-[#6B6B6B]">
                      {contact.projects?.length || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#ABABAB]">{new Date(contact.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right relative">
                    <button 
                      onClick={() => setMenuOpenId(menuOpenId === contact.id ? null : contact.id)}
                      className="rounded-md p-1.5 text-[#ABABAB] hover:bg-[#F0F0F0] hover:text-[#161616] transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpenId === contact.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-5 mt-1 w-32 rounded-lg border border-[#E8E8E8] bg-white p-1 shadow-lg z-20">
                          <button 
                            onClick={() => openEdit(contact)}
                            className="flex w-full items-center px-3 py-2 text-xs font-medium text-[#161616] hover:bg-[#F5F5F5] rounded-md transition-colors"
                          >
                            Edit Contact
                          </button>
                          <button 
                            onClick={() => deleteContact(contact.id)}
                            className="flex w-full items-center px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAddOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#E8E8E8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#161616]">{editingId ? "Edit Contact" : "Add Contact"}</h3>
                <p className="mt-0.5 text-xs text-[#6B6B6B]">
                  {editingId ? "Update contact information." : "Create a client or stakeholder contact."}
                </p>
              </div>
              <button onClick={() => { setIsAddOpen(false); setEditingId(null); setContactForm(emptyContactForm); }} className="rounded p-1 text-[#6B6B6B] hover:bg-[#F5F5F5]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={saveContact} className="space-y-5 p-6">
              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">First Name</label>
                  <input required value={contactForm.first_name} onChange={(event) => setContactForm((current) => ({ ...current, first_name: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">Last Name</label>
                  <input required value={contactForm.last_name} onChange={(event) => setContactForm((current) => ({ ...current, last_name: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">Email</label>
                  <input type="email" value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">Phone</label>
                  <input value={contactForm.phone} onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">Company</label>
                  <input value={contactForm.company} onChange={(event) => setContactForm((current) => ({ ...current, company: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#161616]">Role</label>
                  <input value={contactForm.role} onChange={(event) => setContactForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#ED711D]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#E8E8E8] pt-4">
                <button type="button" onClick={() => { setIsAddOpen(false); setEditingId(null); setContactForm(emptyContactForm); }} className="rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#3D3D3D] hover:bg-[#F5F5F5]">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-md bg-[#ED711D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D4611A] disabled:opacity-60">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? "Save Changes" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
