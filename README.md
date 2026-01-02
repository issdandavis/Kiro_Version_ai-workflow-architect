# AI Workflow Platform v2.0

> **Universal AI Orchestration Platform** - Orchestrate. Automate. Self-Improve.

A powerful, universally adaptable full-stack AI orchestration platform that coordinates multiple AI providers, manages integrations, and builds automated workflows. Features AI autonomy mode, self-improvement capabilities, and enterprise-grade security.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Kiro_Version_ai-workflow-architect/ai-workflow-platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

## 🌟 What Makes This Special

This platform is designed for **universal adaptability** - whether you want to:
- **Sell it as SaaS** - Multi-tenant ready with Stripe billing
- **White-label it** - Fully customizable branding via config
- **Self-host it** - Deploy on any infrastructure
- **Embed it** - Use as a component in larger applications
- **Let AI improve it** - Built-in developer mode for self-modification

## ✨ Features

### Core Platform
- **Multi-AI Orchestration** - OpenAI, Anthropic Claude, Google Gemini, Groq, xAI Grok, Perplexity, and custom providers
- **AI Roundtable** - Multiple AI models discuss and collaborate on problems
- **Integration Hub** - GitHub, Google Drive, Dropbox, Notion, Slack, Discord, Figma, and more
- **Workflow Automation** - Build and run automated task sequences with triggers
- **Secure Credential Vault** - AES-256-GCM encrypted API key storage
- **Cost Tracking** - Monitor AI usage, set budgets, get alerts
- **Enterprise Security** - RBAC, 2FA, audit logging, rate limiting

### 🤖 AI Autonomy Mode (NEW in v2.0)
Let AI take control of the platform at your discretion:
- **Supervised Mode** - Review and approve each action before execution
- **Autonomous Mode** - Full AI control with configurable constraints
- **Goal Execution** - Describe what you want, AI figures out how
- **Action History** - Complete audit trail with rollback capability

### 🛠️ Developer Mode (Self-Improvement)
Edit the app's source code from within the app:
- **In-App Code Editor** - Browse and modify source files
- **AI Code Improvement** - Let AI refactor and enhance code
- **Version Control** - Track changes with rollback support
- **Code Search** - Find anything across the codebase

### 💳 Monetization Ready
- **Stripe Integration** - Subscriptions, one-time payments, usage billing
- **Pricing Tiers** - Free, Starter, Pro, Enterprise (customizable)
- **Promo Codes** - Discount system built-in
- **Usage Metering** - Track and bill for AI usage

### 🛒 E-Commerce
- **Shopify Integration** - Full e-commerce capabilities
- **Product Management** - Sync products and inventory
- **Order Processing** - Automated order workflows

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use SQLite for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/Kiro_Version_ai-workflow-architect/ai-workflow-platform.git
cd ai-workflow-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Database Options

**Option 1: Supabase (Recommended - Free Tier)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the URI to `.env` as `DATABASE_URL`

**Option 2: Local PostgreSQL**
```bash
createdb ai_workflow_db
# Update .env: DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_workflow_db
```

**Option 3: SQLite (Development Only)**
```bash
# No DATABASE_URL needed - will use SQLite automatically
```

### Initialize Database

```bash
npm run db:push
```

### Start Development

```bash
# Single command (recommended)
npm run dev

# Or separate terminals:
npm run dev:client  # Frontend on port 5000
npm run dev:server  # Backend on port 3000
```

Visit **http://localhost:5000**

## 📁 Project Structure

```
ai-workflow-platform/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/         # Application pages (Dashboard, Autonomy, Developer, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                 # Express backend
│   ├── services/          # AI providers, orchestration, autonomy engine
│   ├── middleware/        # Auth, rate limiting, cost governor
│   ├── shopify/           # Shopify integration
│   └── routes.ts          # API endpoints (4500+ lines)
├── shared/                 # Shared types & configuration
│   ├── schema.ts          # Database schema (Drizzle ORM)
│   └── config.ts          # App configuration (branding, features, pricing)
├── docs/                   # Documentation
└── tests/                  # Test suites
```

## 🎨 Customization

### Branding & Configuration

All customization is centralized in `shared/config.ts`:

```typescript
export const APP_CONFIG = {
  name: "Your Brand Name",
  description: "Your description",
  tagline: "Your tagline",
  
  company: {
    name: "Your Company",
    website: "https://yoursite.com",
  },
  
  features: {
    enableAutonomyMode: true,
    enableDeveloperMode: true,
    enableShopify: true,
    // ... toggle any feature
  },
  
  pricing: {
    plans: {
      free: { price: 0, features: [...] },
      pro: { price: 49, features: [...] },
      // ... customize plans
    }
  }
};
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes* |
| `SESSION_SECRET` | Random 32+ character string | Production |
| `PORT` | Server port (default: 5000) | No |
| `APP_ORIGIN` | Your domain URL | Production |

*Not required if using SQLite for development

### AI Provider Keys

| Variable | Provider | Tier |
|----------|----------|------|
| `OPENAI_API_KEY` | OpenAI GPT-4o | Premium |
| `ANTHROPIC_API_KEY` | Claude 3.5 | Premium |
| `GOOGLE_AI_API_KEY` | Gemini Pro | Standard |
| `GROQ_API_KEY` | Llama 3.1 | Free |
| `XAI_API_KEY` | Grok | Premium |
| `PERPLEXITY_API_KEY` | Perplexity | Standard |

## 📡 API Reference

### Authentication
```
POST /api/auth/signup     - Create account
POST /api/auth/login      - Login
POST /api/auth/logout     - Logout
POST /api/auth/guest      - Guest access
GET  /api/auth/me         - Current user
```

### AI & Agents
```
POST /api/agents/run           - Start AI task
GET  /api/agents/run/:id       - Task status
GET  /api/agents/stream/:id    - SSE stream
GET  /api/ai/providers         - Available providers
```

### Autonomy Mode
```
POST /api/autonomy/start       - Start session
POST /api/autonomy/stop        - Stop session
POST /api/autonomy/goal        - Execute goal
GET  /api/autonomy/status      - Session status
GET  /api/autonomy/approvals   - Pending approvals
POST /api/autonomy/approve     - Approve/reject action
GET  /api/autonomy/history     - Action history
```

### Developer Mode
```
POST /api/devmode/start        - Activate
POST /api/devmode/stop         - Deactivate
GET  /api/devmode/files        - List files
GET  /api/devmode/file         - Read file
POST /api/devmode/file         - Write file
POST /api/devmode/file/create  - Create file
DELETE /api/devmode/file       - Delete file
POST /api/devmode/ai/improve   - AI improvement
POST /api/devmode/ai/apply     - Apply changes
POST /api/devmode/rollback     - Rollback change
GET  /api/devmode/search       - Search code
GET  /api/devmode/tree         - Project tree
GET  /api/devmode/history      - Change history
```

### Integrations & Workflows
```
GET  /api/integrations         - List integrations
POST /api/integrations/connect - Connect
GET  /api/workflows            - List workflows
POST /api/workflows            - Create workflow
```

## 🏗️ Deployment

### Production Build
```bash
npm run build
npm run start
```

### Deploy Options

| Platform | Notes |
|----------|-------|
| **Vercel** | `vercel.json` included, zero-config |
| **Railway** | Connect repo, auto-deploy |
| **Render** | Standard Node.js service |
| **AWS/GCP** | Use Docker or direct deployment |
| **Self-hosted** | PM2 or systemd recommended |

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security

- **Password Hashing** - bcrypt with configurable rounds
- **Session Management** - Secure HTTP-only cookies
- **Rate Limiting** - Per-endpoint limits
- **CORS Protection** - Configurable origins
- **Helmet Headers** - Security headers enabled
- **Encrypted Vault** - AES-256-GCM for API keys
- **Audit Logging** - All sensitive operations logged
- **RBAC** - Owner, Admin, Member, Viewer roles
- **2FA Support** - TOTP-based authentication

## 💰 Business Models

This platform supports multiple business models:

1. **SaaS** - Multi-tenant with subscription billing
2. **White-Label** - Rebrand and resell
3. **Enterprise License** - On-premise deployment
4. **Marketplace** - Sell as a product
5. **Consulting** - Customize for clients

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - Free to use, modify, and sell.

---

**Built with:** React 19, Express, TypeScript, PostgreSQL, Drizzle ORM, TailwindCSS, Radix UI

**Version:** 2.0.0 | **Last Updated:** January 2026
