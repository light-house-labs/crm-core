// tenant.config.ts
// This is the generic, white-label CRM core configuration.
// It contains neutral placeholders and should be overridden in client branches.

export type TenantConfig = {
  brand: {
    name: string
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    accentColor: string
    supportEmail: string
  }
  domain: {
    app: string
    publicForm: string
  }
  auth: {
    provider: 'google'
    whitelistEnabled: boolean
  }
  pipeline: {
    stages: Array<{
      id: string
      label: string
      color: string
      order: number
    }>
  }
  leads: {
    sources: string[]
    projectTypes: string[]
    budgetRanges: string[]
    timelines: string[]
  }
  form: {
    heading: string
    subheading: string
    successMessage: string
    fallbackEmail: string
    urlParamKey: string
  }
  features: {
    invoices: boolean
    analytics: boolean
    emailNotifications: boolean
    reengagement: boolean
    activityLog: boolean
  }
  localization: {
    currency: string
    currencySymbol: string
    dateFormat: string
    timezone: string
  }
}

export const tenantConfig: TenantConfig = {
  brand: {
    name: "CRM Core",
    logoUrl: "/logo-generic.png",
    faviconUrl: "/favicon.ico",
    primaryColor: "#ED711D",       // Tiger Orange
    accentColor: "#161616",        // Black
    supportEmail: "support@example.com",
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
      { id: "new",        label: "New",        color: "#E5E7EB", order: 1 },
      { id: "contacted",  label: "Contacted",  color: "#DBEAFE", order: 2 },
      { id: "qualified",  label: "Qualified",  color: "#FEF3C7", order: 3 },
      { id: "converted",  label: "Converted",  color: "#D1FAE5", order: 4 },
      { id: "lost",       label: "Lost",       color: "#FEE2E2", order: 5 },
    ],
  },
  leads: {
    sources: ['website_form', 'cold_email', 'linkedin', 'instagram', 'referral', 'other'],
    projectTypes: ["Option 1", "Option 2", "Option 3"],
    budgetRanges: ["Low", "Medium", "High"],
    timelines: ["Short", "Medium", "Long"],
  },
  form: {
    heading: "Get in Touch",
    subheading: "Fill out the form below to get started.",
    successMessage: "Thank you for reaching out! We will contact you soon.",
    fallbackEmail: "support@example.com",
    urlParamKey: "src",
  },
  features: {
    invoices: true,
    analytics: true,
    emailNotifications: false,
    reengagement: false,
    activityLog: true,
  },
  localization: {
    currency: "USD",
    currencySymbol: "$",
    dateFormat: "DD MMM YYYY",
    timezone: "UTC",
  }
};
