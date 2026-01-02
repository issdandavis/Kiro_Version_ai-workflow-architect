/**
 * Application Configuration
 * 
 * Central configuration file for branding and app settings.
 * Update these values to customize the application for your brand.
 */

export const APP_CONFIG = {
  // === BRANDING ===
  name: "AI Workflow Platform",
  shortName: "AI Platform",
  description: "Multi-AI orchestration platform with workflow automation and enterprise security",
  tagline: "Orchestrate AI. Automate Everything.",
  
  // === COMPANY INFO ===
  company: {
    name: "Your Company",
    website: "https://yourcompany.com",
    support: "support@yourcompany.com",
    twitter: "@yourcompany",
  },
  
  // === THEME ===
  theme: {
    primaryColor: "#6366f1", // Indigo
    accentColor: "#8b5cf6",  // Purple
  },
  
  // === FEATURES ===
  features: {
    enableShopify: true,
    enableStripe: true,
    enableAutonomyMode: true,
    enableDeveloperMode: true,
    enableRoundtable: true,
    enableWorkflows: true,
  },
  
  // === PRICING (customize for your business) ===
  pricing: {
    currency: "USD",
    plans: {
      free: {
        name: "Free",
        price: 0,
        features: ["5 AI requests/day", "Basic integrations", "Community support"],
      },
      starter: {
        name: "Starter",
        price: 19,
        features: ["100 AI requests/day", "All integrations", "Email support"],
      },
      pro: {
        name: "Pro",
        price: 49,
        features: ["Unlimited AI requests", "Priority support", "Custom workflows"],
      },
      enterprise: {
        name: "Enterprise",
        price: null, // Contact sales
        features: ["Custom deployment", "SLA", "Dedicated support"],
      },
    },
  },
  
  // === API LIMITS ===
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxRequestsPerMinute: 60,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // === SUPPORTED AI PROVIDERS ===
  aiProviders: [
    { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
    { id: "anthropic", name: "Anthropic", models: ["claude-3-5-sonnet", "claude-3-haiku"] },
    { id: "google", name: "Google AI", models: ["gemini-pro", "gemini-pro-vision"] },
    { id: "groq", name: "Groq", models: ["llama-3.1-70b", "mixtral-8x7b"] },
    { id: "xai", name: "xAI", models: ["grok-beta"] },
    { id: "perplexity", name: "Perplexity", models: ["pplx-70b-online"] },
  ],
  
  // === INTEGRATIONS ===
  integrations: [
    { id: "github", name: "GitHub", category: "development" },
    { id: "notion", name: "Notion", category: "productivity" },
    { id: "google_drive", name: "Google Drive", category: "storage" },
    { id: "dropbox", name: "Dropbox", category: "storage" },
    { id: "onedrive", name: "OneDrive", category: "storage" },
    { id: "slack", name: "Slack", category: "communication" },
    { id: "zapier", name: "Zapier", category: "automation" },
  ],
};

// Export individual configs for convenience
export const { name: APP_NAME, shortName: APP_SHORT_NAME, description: APP_DESCRIPTION } = APP_CONFIG;
export const { company: COMPANY_INFO } = APP_CONFIG;
export const { features: FEATURES } = APP_CONFIG;
export const { pricing: PRICING } = APP_CONFIG;
export const { limits: LIMITS } = APP_CONFIG;
export const { aiProviders: AI_PROVIDERS } = APP_CONFIG;
export const { integrations: INTEGRATIONS } = APP_CONFIG;
