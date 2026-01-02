# AI Workflow Platform

A powerful full-stack AI orchestration platform that lets you coordinate multiple AI providers, manage integrations, and build automated workflows. Features AI autonomy mode and self-improvement capabilities.

## ✨ Features

### Core Platform
- **Multi-AI Orchestration** - Use OpenAI, Anthropic Claude, Google Gemini, Groq, xAI Grok, and Perplexity
- **AI Roundtable** - Have multiple AI models discuss and collaborate on problems
- **Integration Hub** - Connect GitHub, Google Drive, Dropbox, Notion, and more
- **Workflow Automation** - Build and run automated task sequences
- **Secure Credential Vault** - Safely store and manage API keys with AES-256-GCM encryption
- **Cost Tracking** - Monitor AI usage and set budget limits
- **Enterprise Security** - RBAC, 2FA, audit logging, rate limiting

### Advanced Features
- **🤖 AI Autonomy Mode** - Let AI take full control of the app at your discretion
- **🛠️ Developer Mode** - Edit the app's source code from within the app (self-improvement)
- **💳 Stripe Payments** - Built-in subscription and payment handling
- **🛒 Shopify Integration** - E-commerce capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use [Supabase](https://supabase.com) - free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-workflow-platform.git
cd ai-workflow-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configure Database

**Option 1: Supabase (Recommended - Free)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the URI and paste in `.env` as `DATABASE_URL`

**Option 2: Local PostgreSQL**
```bash
createdb ai_workflow_db
# Update .env: DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_workflow_db
```

### Push Database Schema

```bash
npm run db:push
```

### Start Development Servers

```bash
# Terminal 1 - Frontend (port 5000)
npm run dev:client

# Terminal 2 - Backend (port 3000)
npm run dev:server
```

Visit **http://localhost:5000**

## 📁 Project Structure

```
├── client/           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/    # Application pages
│   │   ├── components/
│   │   └── hooks/
├── server/           # Express backend
│   ├── services/     # AI providers, orchestration, autonomy
│   ├── middleware/   # Auth, rate limiting
│   └── routes.ts     # API endpoints
├── shared/           # Shared types & configuration
│   ├── schema.ts     # Database schema (Drizzle ORM)
│   └── config.ts     # App configuration (branding, features)
└── docs/             # Documentation
```

## 🎨 Customization

### Branding & Configuration
Edit `shared/config.ts` to customize:
- App name and description
- Company information
- Pricing plans
- Feature toggles
- AI providers
- Integrations

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random 32+ character string |
| `PORT` | Backend port (default: 3000) |

### AI Provider Keys (Optional)

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI GPT |
| `ANTHROPIC_API_KEY` | Claude |
| `GOOGLE_AI_API_KEY` | Gemini |
| `GROQ_API_KEY` | Groq |
| `XAI_API_KEY` | Grok |
| `PERPLEXITY_API_KEY` | Perplexity |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### AI & Agents
- `POST /api/agents/run` - Start AI agent task
- `GET /api/agents/run/:id` - Get task status
- `GET /api/ai/providers` - List available AI providers

### Autonomy Mode
- `POST /api/autonomy/start` - Start autonomy session
- `POST /api/autonomy/stop` - Stop autonomy session
- `POST /api/autonomy/goal` - Execute goal autonomously
- `GET /api/autonomy/status` - Get session status

### Developer Mode
- `POST /api/devmode/start` - Start developer mode
- `GET /api/devmode/files` - List files
- `GET /api/devmode/file` - Read file
- `POST /api/devmode/file` - Write file
- `POST /api/devmode/ai/improve` - AI code improvement

### Integrations
- `GET /api/integrations` - List connected integrations
- `POST /api/integrations/connect` - Connect new integration

## 🏗️ Production Deployment

```bash
npm run build
npm run start
```

### Deploy to:
- **Vercel** - `vercel.json` included
- **Railway/Render** - Standard Node.js deployment
- **Docker** - Dockerfile can be added
- **Any VPS** - PM2 or systemd

## 🔒 Security Features

- Password hashing with bcrypt
- Session management with secure cookies
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Encrypted credential storage (AES-256-GCM)
- Audit logging for all sensitive operations
- Role-based access control (Owner, Admin, Member, Viewer)

## 💰 Monetization Ready

- Stripe integration for subscriptions
- Multiple pricing tiers (Free, Starter, Pro, Enterprise)
- Usage tracking and billing
- Promo code system

## 📄 License

MIT License - Free to use, modify, and sell.

---

Built with React, Express, TypeScript, and PostgreSQL
