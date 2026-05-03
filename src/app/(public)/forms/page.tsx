"use client";
import { config } from "@/lib/config";
import { CrmOptions, defaultCrmOptions, fetchCrmOptions } from "@/lib/crm-options";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PublicFormPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crmOptions, setCrmOptions] = useState<CrmOptions>(defaultCrmOptions);

  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient();
      const optionResult = await fetchCrmOptions(supabase);
      setCrmOptions(optionResult.options);
    }

    void loadOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      website: formData.get("website"),
      project_type: formData.get("project_type"),
      budget_range: formData.get("budget_range"),
      timeline: formData.get("timeline"),
      message: formData.get("message"),
      source: "website_form",
      status: "new"
    };

    const supabase = createClient();
    const { error: dbError } = await supabase.from("leads").insert([data]);

    if (dbError) {
      console.error(dbError);
      setError("Something went wrong. Please try again or contact " + config.brand.supportEmail);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-[#E8E8E8] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#161616] mb-2">Success!</h2>
          <p className="text-[#6B6B6B]">{config.form.successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-[#E8E8E8] overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-[#161616] px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ED711D] rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">{config.form.heading}</h2>
          <p className="text-gray-400 relative z-10">{config.form.subheading}</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-[#161616]">First name <span className="text-red-500">*</span></label>
              <input type="text" name="first_name" id="first_name" required className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-[#161616]">Last name <span className="text-red-500">*</span></label>
              <input type="text" name="last_name" id="last_name" required className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#161616]">Email address <span className="text-red-500">*</span></label>
              <input type="email" name="email" id="email" required className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#161616]">Phone number</label>
              <input type="tel" name="phone" id="phone" className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[#161616]">Company / Organisation</label>
              <input type="text" name="company" id="company" className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-[#161616]">Website</label>
              <input type="url" name="website" id="website" placeholder="https://" className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]" />
            </div>
          </div>

          <div>
            <label htmlFor="project_type" className="block text-sm font-medium text-[#161616]">What do you need? <span className="text-red-500">*</span></label>
            <select name="project_type" id="project_type" required className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
              <option value="">Select a service</option>
              {crmOptions.project_type.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget_range" className="block text-sm font-medium text-[#161616]">Approx budget</label>
              <select name="budget_range" id="budget_range" className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                <option value="">Select range</option>
                {crmOptions.budget_range.map(br => (
                  <option key={br} value={br}>{br}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-[#161616]">Timeline</label>
              <select name="timeline" id="timeline" className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D] bg-white">
                <option value="">Select timeline</option>
                {crmOptions.timeline.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-[#161616]">Tell us more</label>
            <textarea name="message" id="message" rows={4} className="mt-1 block w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#ED711D] focus:outline-none focus:ring-1 focus:ring-[#ED711D]"></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#ED711D] hover:bg-[#D4611A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED711D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
