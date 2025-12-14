# AI Orchestration Hub - Production Deployment Guide

A full-stack AI multi-agent orchestration platform with cost controls, secure integrations, and centralized memory.

## Features

- **Multi-Agent Orchestration**: Coordinate OpenAI, Anthropic, xAI, and Perplexity models
- **Integration Vault**: Connect GitHub, Google Drive, Dropbox, Notion, Zapier, and more
- **Cost Governance**: Daily/monthly budgets with automatic enforcement
- **Memory Layer**: Centralized and decentralized memory with keyword search
- **Audit Logging**: Complete audit trail for all operations
- **RBAC**: Owner, Admin, Member, Viewer roles
- **Rate Limiting**: Protection against abuse
- **Branch-First Git**: Safe repository operations (no direct main pushes)

## Required Environment Variables (Replit Secrets)

### Core (Required)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET` - Secure random string for session encryption
- `APP_ORIGIN` - Your app URL (e.g., https://your-app.replit.app)

### AI Providers (Optional - add as needed)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic (Claude) API key
- `XAI_API_KEY` - xAI (Grok) API key
- `PERPLEXITY_API_KEY` - Perplexity API key

### Integrations (Optional - add as needed)
- `GITHUB_TOKEN` - GitHub Personal Access Token for repo operations
- `GOOGLE_DRIVE_CLIENT_ID` - Google Drive OAuth client ID
- `GOOGLE_DRIVE_CLIENT_SECRET` - Google Drive OAuth secret
- `DROPBOX_ACCESS_TOKEN` - Dropbox access token
- `NOTION_TOKEN` - Notion integration token

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start dev server (backend + frontend)
npm run dev
```

The app will be available at `http://localhost:5000`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Deployment Checklist

- [ ] **Add Required Secrets**: SESSION_SECRET, APP_ORIGIN
- [ ] **Add AI Provider Keys**: At least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY
- [ ] **Verify Database**: DATABASE_URL is set (Replit auto-configures this)
- [ ] **Test Auth Flow**: Create account, login, logout
- [ ] **Test Agent Run**: Execute at least one agent with stub or real provider
- [ ] **Configure Budgets**: Set daily/monthly budgets via API
- [ ] **Test Integrations**: Connect at least one integration
- [ ] **Review Audit Logs**: Verify logging works via GET /api/audit
- [ ] **Deploy**: Use Replit's "Publish" button to make the app live

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations/connect` - Connect provider
- `POST /api/integrations/disconnect` - Disconnect provider

### Agent Orchestration
- `POST /api/agents/run` - Start agent run
- `GET /api/agents/run/:runId` - Get run status
- `GET /api/agents/stream/:runId` - Stream run logs (SSE)

### Memory
- `POST /api/memory/add` - Add memory item
- `GET /api/memory/search?projectId=X&q=query` - Search memory

### Git Operations
- `GET /api/repos` - List configured repos
- `POST /api/repos/commit` - Create branch-first commit

### Health
- `GET /api/health` - Health check

## Security Features

- **Helmet**: Security headers
- **CORS**: Locked to APP_ORIGIN
- **Rate Limiting**: 
  - Auth: 5 attempts per 15 min
  - API: 100 requests per 15 min
  - Agents: 10 runs per minute
- **Session Management**: HTTP-only cookies
- **RBAC**: Role-based access control
- **Audit Logging**: All sensitive operations logged

## Architecture

```
client/              # React frontend (Vite)
  src/
    pages/          # All UI pages
    components/     # Shared components
    
server/             # Express backend
  auth.ts           # Authentication & RBAC
  db.ts             # Database connection
  routes.ts         # All API routes
  storage.ts        # Database operations
  middleware/       # Rate limiting, cost control
  services/         # Orchestrator, provider adapters
  
shared/             # Shared types
  schema.ts         # Drizzle schema & types
```

## Provider Adapters

The system includes safe stub adapters for all providers. When API keys are not configured:
- Providers return a "not configured" message
- UI remains functional
- Logs indicate missing configuration
- No crashes or errors

To enable real provider calls, add the appropriate API keys to Replit Secrets.

## Cost Controls

1. **Set Budgets**: Create daily/monthly budgets via API
2. **Automatic Enforcement**: Agent runs blocked when budget exceeded
3. **Cost Tracking**: Each run estimates and tracks costs
4. **Audit Trail**: All cost events logged

Example budget creation:
```bash
curl -X POST /api/budgets \
  -H "Content-Type: application/json" \
  -d '{"orgId":"<org-id>","period":"daily","limitUsd":"10.00"}'
```

## Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL is set in Secrets
- Run `npm run db:push` to sync schema

### "Session secret not set"
- Add SESSION_SECRET to Replit Secrets (use a long random string)

### "Provider not configured"
- Add the appropriate API key to Replit Secrets
- Example: OPENAI_API_KEY for OpenAI

### "Budget exceeded"
- Check current budget: GET /api/budgets
- Reset or increase budget limits

## Support

For issues or questions, check:
1. Replit logs for error messages
2. Database connection status
3. Environment variables in Secrets
4. Audit logs via API for operation history

## License

MIT
