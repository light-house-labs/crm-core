// clients/lighthouse/lighthouse.config.ts
export const tenantConfig = {
  brand: {
    name: "Lighthouse Labs",
    logoUrl: "https://www.lighthouselabs.in/logo.png",
    faviconUrl: "https://www.lighthouselabs.in/favicon.ico",
    primaryColor: "#0F6E56",     // Lighthouse teal
    accentColor: "#534AB7",      // purple
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
      { id: "new_inquiry",     label: "New inquiry",     color: "#D3D1C7" },
      { id: "discovery_call",  label: "Discovery call",  color: "#9FE1CB" },
      { id: "proposal_sent",   label: "Proposal sent",   color: "#B5D4F4" },
      { id: "negotiation",     label: "Negotiation",     color: "#FAC775" },
      { id: "won",             label: "Won",             color: "#C0DD97" },
      { id: "lost",            label: "Lost",            color: "#F7C1C1" },
    ],
  },
  form: {
    fields: {
      projectTypes: ["Website", "E-commerce store", "Web application", "Digital presence", "Not sure"],
      budgetRanges: ["Under ₹1L", "₹1L–3L", "₹3L–10L", "Above ₹10L", "Not sure yet"],
      timelines: ["ASAP", "1–3 months", "3–6 months", "Flexible"],
    },
    successMessage: "Thanks! We will be in touch within 24 hours.",
    fallbackEmail: "sales@lighthouselabs.in",
  },
  features: {
    invoices: true,
    analytics: true,
    emailNotifications: false,   // Phase 2
    reengagement: true,
  },
}
