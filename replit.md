# AI Orchestration Hub

## Overview

AI Orchestration Hub is a full-stack multi-agent AI orchestration platform that coordinates multiple AI providers (OpenAI, Anthropic, xAI, Perplexity) with cost controls, secure integrations, and centralized memory. The platform enables teams to manage AI workflows across connected services like GitHub, Google Drive, OneDrive, Notion, and Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

---

## 🔐 SECRETS & INTEGRATIONS LOCKER

All integrations are managed securely through **Replit's Secrets tab** (lock icon in sidebar). Never hardcode API keys!

### Connected Integrations (via Replit Connectors)
| Integration | Status | How to Access |
|------------|--------|---------------|
| **Google Drive** | ✅ Connected | Uses Replit OAuth - `server/services/googleDriveClient.ts` |
| **OneDrive** | ✅ Connected | Uses Replit OAuth - `server/services/oneDriveClient.ts` |
| **Notion** | ✅ Connected | Uses Replit OAuth - `server/services/notionClient.ts` |
| **Stripe** | ✅ Connected | Uses Replit Connector - `server/services/stripeClient.ts` |
| **GitHub** | ✅ Connected | Uses Replit OAuth - existing integration |
| **World Anvil** | ✅ Connected | Uses API Key - `server/services/worldAnvilClient.ts` |

### AI Provider API Keys (in Secrets tab)
| Secret Name | Provider | Used For |
|------------|----------|----------|
| `ANTHROPIC_API_KEY` | Claude AI | AI orchestration, code analysis |
| `XAI_API_KEY` | Grok/xAI | AI orchestration |
| `PERPLEXITY_API_KEY` | Perplexity | Web search, research |
| `GOOGLE_API_KEY` | Google AI | Optional AI features |

### System Secrets
| Secret Name | Purpose |
|------------|---------|
| `DATABASE_URL` | PostgreSQL connection (auto-set by Replit) |
| `SESSION_SECRET` | User session encryption |

**To add/edit secrets:** Click the Secrets tab (🔒 lock icon) in the left sidebar.

---

## 📋 CHANGELOG

### ✅ COMPLETED FEATURES

#### Core Infrastructure
- [x] Express.js backend with TypeScript
- [x] PostgreSQL database with Drizzle ORM
- [x] Session-based authentication with bcrypt
- [x] Role-Based Access Control (owner, admin, member, viewer)
- [x] Rate limiting on all endpoints
- [x] Helmet security headers

#### Frontend
- [x] React 18 with TypeScript and Vite
- [x] Tailwind CSS v4 with shadcn/ui components
- [x] Wouter routing with 12 pages:
  - Dashboard (Command Deck)
  - Coding Studio (Monaco editor)
  - Agents page
  - Storage page
  - Integrations page
  - Settings page
  - Login/Signup
  - Roundtable (multi-AI discussions)
  - Usage tracking

#### Multi-AI Orchestration
- [x] Provider adapters for Claude, GPT, Grok, Perplexity
- [x] Roundtable multi-AI discussion sessions
- [x] Usage tracking and cost estimation
- [x] Decision traces with approval workflows

#### Integrations (All Connected)
- [x] Google Drive - list, upload, download, create folders, delete
- [x] OneDrive - list, upload, download, create folders, delete
- [x] Notion - pages and databases CRUD
- [x] Stripe - products, prices, checkout, subscriptions, portal
- [x] GitHub - repository operations

#### Database Schema
- [x] Users, Organizations, Projects
- [x] Integrations and Secret References
- [x] Agent Runs, Messages, Memory Items
- [x] Roundtable Sessions and Messages
- [x] Usage Records and Budgets
- [x] Workspaces
- [x] Subscriptions (linked to Stripe)
- [x] Promo Codes and Redemptions
- [x] Storage Files tracking

---

### 🔲 TODO - FEATURES TO BUILD

#### ✅ COMPLETED: Storage Hub
- [x] Built unified Storage Hub connecting Google Drive, OneDrive, Dropbox
- [x] Provider selection tabs with storage quota display
- [x] File browser with folder navigation and breadcrumbs
- [x] Download, upload, delete functionality
- [x] AI-powered file search using Gemini

**Key files:**
- `client/src/pages/Storage.tsx` - Frontend with real API integration
- `server/services/storageHub.ts` - Unified storage aggregation service
- `server/services/dropboxClient.ts` - Dropbox integration
- `server/routes.ts` - Unified storage routes at `/api/storage/*`

#### ✅ COMPLETED: YouTube + Coding Split View
- [x] Resizable split-panel layout with YouTube and Monaco editor
- [x] YouTube URL input with video embedding
- [x] LocalStorage persistence for video URL
- [x] Mobile responsive with show/hide toggle

**Key file:** `client/src/pages/CodingStudio.tsx`

#### ✅ COMPLETED: Shopify Banner
- [x] Footer banner linking to Aethermore Works store
- [x] Shopify branding with green gradient

**Key files:**
- `client/src/components/ShopifyBanner.tsx`
- `client/src/components/dashboard/Layout.tsx`

#### Priority 2: Workspace System
- [ ] Create workspace CRUD API routes
- [ ] Build workspace management UI
- [ ] Link workspaces to projects
- [ ] Add file association to workspaces

**Relevant files:**
- `shared/schema.ts` - `workspaces` table is ready
- `server/storage.ts` - Add workspace storage methods
- `server/routes.ts` - Add workspace routes

#### Priority 3: Website Builder Wizard
- [ ] Create multi-step wizard component
- [ ] Step 1: Plan (define requirements)
- [ ] Step 2: Design (select templates)
- [ ] Step 3: Build (generate code with AI)
- [ ] Step 4: Deploy (publish to Replit)

**Suggested approach:**
- Create `client/src/pages/WebsiteBuilder.tsx`
- Use stepper component from shadcn/ui
- Integrate with AI providers for code generation

#### Priority 4: Stripe Subscriptions UI
- [x] Build pricing page with plan tiers (Shop.tsx updated!)
- [x] Create Stripe products ($49 lifetime, $9/month)
- [x] Implement checkout flow
- [ ] Add subscription management in Settings
- [ ] Promo code redemption UI

**Stripe Products Created:**
| Product | Price ID | Amount |
|---------|----------|--------|
| AI Orchestration Hub - Lifetime Access | price_1SeMsREbFOchx4qYSgaxCHwo | $49 one-time |
| AI Orchestration Hub - Monthly | price_1SeMsSEbFOchx4qYrHFo6ghf | $9/month |

**Relevant files:**
- `client/src/pages/Shop.tsx` - Pricing page with Stripe checkout
- `server/services/stripeClient.ts` - Stripe API (createStripeProduct, createStripePrice added)
- `shared/schema.ts` - `subscriptions`, `promoCodes`, `promoRedemptions` tables ready
- API routes exist: `/api/stripe/products`, `/api/stripe/checkout`, `/api/stripe/product`, `/api/stripe/price`

---

## 🏗️ SYSTEM ARCHITECTURE

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI animations
- **Build Tool**: Vite with custom plugins

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple
- **Security**: Helmet, bcrypt, CORS, rate limiting

### Key Directories
```
├── client/src/
│   ├── pages/          # React page components
│   ├── components/     # Reusable UI components
│   └── lib/            # Utilities and API client
├── server/
│   ├── services/       # Integration clients (Google Drive, Stripe, etc.)
│   ├── routes.ts       # All API endpoints
│   ├── storage.ts      # Database operations
│   └── index.ts        # Server entry point
└── shared/
    └── schema.ts       # Drizzle database schema
```

### API Routes Reference
| Route | Method | Description |
|-------|--------|-------------|
| `/api/google-drive/*` | GET/POST/DELETE | Google Drive operations |
| `/api/onedrive/*` | GET/POST/DELETE | OneDrive operations |
| `/api/notion/*` | GET/POST/PATCH/DELETE | Notion pages/databases |
| `/api/stripe/*` | GET/POST/DELETE | Stripe products/checkout/subscriptions |
| `/api/roundtable/*` | GET/POST | Multi-AI discussion sessions |
| `/api/auth/*` | POST | Login/signup/logout |

---

## 🔧 DEVELOPMENT COMMANDS

```bash
npm run dev          # Start development server (port 5000)
npm run db:push      # Sync database schema changes
npm run build        # Build for production
```

---

## 📝 INSTRUCTIONS FOR AI ASSISTANTS (Codex, Copilot, etc.)

When working on this codebase:

1. **Database changes**: Edit `shared/schema.ts`, then run `npm run db:push`
2. **New API routes**: Add to `server/routes.ts` using existing patterns
3. **New pages**: Add to `client/src/pages/` and register in `client/src/App.tsx`
4. **Integration clients**: Follow pattern in `server/services/` - use dynamic imports
5. **Don't hardcode secrets**: Use Replit Secrets tab or connectors
6. **Test IDs**: Add `data-testid` to interactive elements

### Code Patterns to Follow

**Adding a new API route:**
```typescript
app.get("/api/example", requireAuth, apiLimiter, async (req, res) => {
  try {
    // Your logic here
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Failed" });
  }
});
```

**Using an integration client:**
```typescript
const { listDriveFiles } = await import("./services/googleDriveClient");
const files = await listDriveFiles();
```

**Adding to database schema:**
```typescript
export const newTable = pgTable("new_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // ... fields
});
export const insertNewTableSchema = createInsertSchema(newTable).omit({ id: true });
export type NewTable = typeof newTable.$inferSelect;
```
