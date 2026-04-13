// tenant.config.ts
// This is the generic, white-label CRM core configuration.
// It contains neutral placeholders and should be overridden in client branches.

export const tenantConfig = {
  brand: {
    name: "CRM Core",
    logoUrl: "/logo-generic.png",
    faviconUrl: "/favicon.ico",
    primaryColor: "#333333",       // Neutral dark grey
    accentColor: "#666666",        // Neutral light grey
  },
  domain: {
    app: "localhost:3000",
    publicForm: "localhost:3000/forms",
  },
  auth: {
    provider: "google",
    whitelistEnabled: true,
  },
  pipeline: {
    stages: [
      { id: "new",        label: "New",        color: "#E5E7EB" }, // Tailwind gray-200
      { id: "contacted",  label: "Contacted",  color: "#DBEAFE" }, // Tailwind blue-100
      { id: "qualified",  label: "Qualified",  color: "#FEF3C7" }, // Tailwind yellow-100
      { id: "converted",  label: "Converted",  color: "#D1FAE5" }, // Tailwind green-100
      { id: "lost",       label: "Lost",       color: "#FEE2E2" }, // Tailwind red-100
    ],
  },
  form: {
    fields: {
      projectTypes: ["Option 1", "Option 2", "Option 3"],
      budgetRanges: ["Low", "Medium", "High"],
      timelines: ["Short", "Medium", "Long"],
    },
    successMessage: "Thank you for reaching out! We will contact you soon.",
    fallbackEmail: "support@example.com",
  },
  features: {
    invoices: true,
    analytics: true,
    emailNotifications: false,
    reengagement: false,
  },
};
