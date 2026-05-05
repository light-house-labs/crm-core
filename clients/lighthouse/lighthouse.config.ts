export const tenantConfig = {
  brand: {
    name: "Lighthouse Labs",
    logoUrl: "https://www.lighthouselabs.in/logo.png",
    faviconUrl: "https://www.lighthouselabs.in/favicon.ico",
    primaryColor: "#0F6E56",
    accentColor: "#534AB7",
    supportEmail: "sales@lighthouselabs.in",
  },
  domain: {
    app: "app.lighthouselabs.in",
    publicForm: "lighthouselabs.in/forms",
  },
  auth: {
    provider: "google",
    whitelistEnabled: true,
  },
  pipeline: {
    stages: [
      { id: "new_inquiry",    label: "New Inquiry",    color: "#D3D1C7", order: 1 },
      { id: "discovery_call", label: "Discovery Call", color: "#9FE1CB", order: 2 },
      { id: "proposal_sent",  label: "Proposal Sent",  color: "#B5D4F4", order: 3 },
      { id: "negotiation",    label: "Negotiation",    color: "#FAC775", order: 4 },
      { id: "won",            label: "Won",            color: "#C0DD97", order: 5 },
      { id: "lost",           label: "Lost",           color: "#F7C1C1", order: 6 },
    ],
  },
  leads: {
    sources: ["website_form", "cold_email", "linkedin", "instagram", "referral", "direct_call"],
    projectTypes: ["Website", "E-commerce store", "Web application", "Digital presence", "Not sure"],
    budgetRanges: ["Under ₹1L", "₹1L–3L", "₹3L–10L", "Above ₹10L", "Not sure yet"],
    timelines: ["ASAP", "1–3 months", "3–6 months", "Flexible"],
  },
  form: {
    heading: "Start a Project",
    subheading: "Tell us what you're building. We'll get back to you within 24 hours.",
    successMessage: "Thanks! We'll be in touch within 24 hours.",
    fallbackEmail: "sales@lighthouselabs.in",
    urlParamKey: "src",
  },
  features: {
    invoices: true,
    analytics: true,
    emailNotifications: false,
    reengagement: true,
    activityLog: true,
  },
  localization: {
    currency: "INR",
    currencySymbol: "₹",
    dateFormat: "DD MMM YYYY",
    timezone: "Asia/Kolkata",
  },
};
