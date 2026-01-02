# AI Workflow Architect

A powerful full-stack AI orchestration platform that lets you coordinate multiple AI providers, manage integrations, and build automated workflows.

## ✨ Features

- **Multi-AI Orchestration** - Use OpenAI, Anthropic Claude, Google Gemini, Groq, xAI Grok, and Perplexity
- **AI Roundtable** - Have multiple AI models discuss and collaborate on problems
- **Integration Hub** - Connect GitHub, Google Drive, Dropbox, Notion, and more
- **Workflow Automation** - Build and run automated task sequences
- **Secure Credential Vault** - Safely store and manage API keys with encryption
- **Cost Tracking** - Monitor AI usage and set budget limits
- **Enterprise Security** - RBAC, 2FA, audit logging, rate limiting
- **Stripe Payments** - Built-in subscription and payment handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use [Supabase](https://supabase.com) - free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-workflow-architect.git
cd ai-workflow-architect

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
# Create database
createdb ai_workflow_db

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_workflow_db
```

### Push Database Schema

```bash
npm run db:push
```

### Start Development Servers

**Windows:**
```bash
# Double-click start-dev.bat
# OR run both commands in separate terminals:
npm run dev:client    # Frontend on http://localhost:5000
npm run dev:server    # Backend on http://localhost:3000
```

**Mac/Linux:**
```bash
# Terminal 1 - Frontend
npm run dev:client

# Terminal 2 - Backend  
npm run dev:server
```

### Open the App
Visit **http://localhost:5000** in your browser!

## 📁 Project Structure

```
├── client/           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/    # Application pages
│   │   ├── components/
│   │   └── hooks/
│   └── index.html
├── server/           # Express backend
│   ├── services/     # AI providers, orchestration
│   ├── middleware/   # Auth, rate limiting
│   └── routes.ts     # API endpoints
├── shared/           # Shared types & schema
│   └── schema.ts     # Database schema (Drizzle ORM)
└── docs/             # Documentation
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random 32+ character string |
| `PORT` | Backend port (default: 3000) |

### AI Provider Keys (Optional - add what you need)

| Variable | Provider | Get Key |
|----------|----------|---------|
| `OPENAI_API_KEY` | OpenAI GPT | [platform.openai.com](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Claude | [console.anthropic.com](https://console.anthropic.com/) |
| `GOOGLE_AI_API_KEY` | Gemini | [makersuite.google.com](https://makersuite.google.com/app/apikey) |
| `GROQ_API_KEY` | Groq | [console.groq.com](https://console.groq.com/keys) |
| `XAI_API_KEY` | Grok | [console.x.ai](https://console.x.ai/) |
| `PERPLEXITY_API_KEY` | Perplexity | [perplexity.ai/settings](https://www.perplexity.ai/settings/api) |

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

### Integrations
- `GET /api/integrations` - List connected integrations
- `POST /api/integrations/connect` - Connect new integration

### Credentials Vault
- `GET /api/vault/credentials` - List stored credentials
- `POST /api/vault/credentials` - Store new API key
- `POST /api/vault/credentials/test` - Test API key validity

## 🏗️ Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Deploy to:
- **Vercel** - `vercel.json` included
- **Replit** - `.replit` config included
- **Railway/Render** - Use standard Node.js deployment

## 🔒 Security Features

- **Password hashing** with bcrypt
- **Session management** with secure cookies
- **Rate limiting** on all endpoints
- **CORS protection**
- **Helmet security headers**
- **Encrypted credential storage** (AES-256-GCM)
- **Audit logging** for all sensitive operations
- **Role-based access control** (Owner, Admin, Member, Viewer)

## 📚 Documentation

- [Cost Optimization Guide](docs/COST_OPTIMIZATION_QUICK_REF.md)
- [Full Feature List](docs/FULL_FEATURE_LIST.md)
- [Project Documentation](docs/PROJECT_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using React, Express, TypeScript, and PostgreSQL
