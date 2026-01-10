# Living Document Review & Automation System

A complete, production-ready system for managing research sources, patents, papers, and GitHub repositories with automated ingestion and review workflows.

## 📚 Overview

The Living Document Review system provides:

- **Automated URL ingestion** - Fetch and store research sources nightly
- **Unique taxonomy IDs** - Number-Letter-Symbol system for stable cross-referencing
- **GitHub-based workflow** - Issues for each source with review checklists
- **Firebase sync** - Real-time updates to connected Studio apps
- **Audit trail** - Complete version history via Git

> **🚀 New to the system?** See [Quick Start Guide](QUICK_START_LIVING_DOCS.md) for a 5-minute setup!

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  urls.txt   │────▶│  Ingestion   │────▶│   GitHub    │
│ (Master)    │     │   Pipeline   │     │   Issues    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  data/raw/   │     │   Review    │
                    │  data/meta/  │     │   Workflow  │
                    └──────────────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Firebase   │
                                         │    Sync     │
                                         └─────────────┘
```

## 🚀 Quick Start

### 1. Add URLs

Add research sources to `urls.txt`:

```text
# Patents
https://patents.google.com/patent/US1234567

# Academic Papers
https://arxiv.org/abs/2401.12345

# GitHub Repos
https://github.com/example/repo

# Industry News
https://spacenews.com/article-title
```

### 2. Run Ingestion

#### Manual (Local):

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GITHUB_REPOSITORY="owner/repo"
export GITHUB_TOKEN="your_token"

# Run ingestion
python src/ingest.py
```

#### Automatic (GitHub Actions):

The system runs automatically every night at 02:00 UTC via GitHub Actions. You can also trigger it manually:

1. Go to **Actions** tab
2. Select **Ingest Sources Nightly**
3. Click **Run workflow**

### 3. Review Issues

Each source gets a GitHub issue with:

- **Unique ID** (e.g., `3.CB†`) for stable cross-referencing
- **Metadata** extracted from the source
- **Checklist** for reviewers to complete
- **Labels** for categorization (`major-3`, `section-C`)

### 4. Update Living Document

Add summaries to `docs/living-document.md` under the appropriate taxonomy section.

## 📁 Directory Structure

```
.
├── data/
│   ├── raw/              # Raw HTML/PDF files
│   └── meta/             # JSON metadata per source
├── src/
│   ├── ingest.py         # Main ingestion script
│   └── utils.py          # Helper functions
├── docs/
│   ├── taxonomy.md       # Taxonomy reference
│   └── living-document.md # Living document
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── source_review.md
│   └── workflows/
│       ├── ingest-sources.yml  # Nightly ingestion
│       └── firebase-sync.yml   # Firebase sync
├── urls.txt              # Master URL list
└── requirements.txt      # Python dependencies
```

## 🔢 Taxonomy System

### ID Format: `<Major>.<Section><Letter><Symbol>`

**Example**: `3.CB†`

- `3` = GitHub repos (major category)
- `C` = Combat Network section
- `B` = Second repo in that section
- `†` = Primary document marker

### Major Categories

| Major | Category | Examples |
|-------|----------|----------|
| **1** | Patents & IP | Space-Debris (A), Quantum-Key (B), Swarm-Nav (C) |
| **2** | Academic Papers | Quantum-Computing (A), Spatial-Routing (B), Crypto (C) |
| **3** | GitHub Repos | Spiralverse SDK (A), Space-Tor Router (B), Combat-Network (C) |
| **4** | Industry News | Astroscale (A), Seraphim (B), SpaceX (C) |
| **5** | Internal Tools | Perplexity-Memory (A), Workflow-Architect (B) |

See [docs/taxonomy.md](docs/taxonomy.md) for complete reference.

## 🔄 Workflow

1. **Add URL** to `urls.txt`
2. **Nightly Action** runs `src/ingest.py`
3. **Issue Created** with taxonomy ID and labels
4. **Reviewer** adds summary and links
5. **Update** `docs/living-document.md`
6. **Firebase Sync** pushes to Studio apps

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_REPOSITORY` | Full repo name (e.g., `owner/repo`) | Yes |
| `GITHUB_TOKEN` | GitHub token with `repo` and `issues` scopes | Yes |
| `FIREBASE_CONFIG` | Firebase configuration JSON | For sync |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account key | For sync |

### GitHub Actions Secrets

Configure in **Settings → Secrets and variables → Actions**:

- `GITHUB_TOKEN` - Automatically provided by GitHub
- `FIREBASE_CONFIG` - Firebase project configuration
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account key

## 📊 Features

### Ingestion Pipeline

- ✅ Fetch content from URLs (HTML, PDF, etc.)
- ✅ Extract metadata (title, authors, content-type)
- ✅ Store raw content in `data/raw/`
- ✅ Store metadata JSON in `data/meta/`
- ✅ Generate unique taxonomy IDs
- ✅ Create GitHub issues with labels
- ✅ Prevent duplicate issues

### Review Workflow

- ✅ GitHub issue per source
- ✅ Checklist for reviewers
- ✅ Taxonomy labels for filtering
- ✅ Cross-referencing via IDs
- ✅ Audit trail via Git history

### Firebase Sync

- ✅ Auto-sync on document updates
- ✅ JSON payload with metadata
- ✅ Commit SHA tracking
- ✅ Ready for Firebase integration

## 🧪 Testing

Test the ingestion script locally:

```bash
# Create test URLs file
cat > urls.txt << 'EOF'
https://github.com/torvalds/linux
https://arxiv.org/abs/2401.00001
EOF

# Run ingestion (dry-run without GitHub token)
python src/ingest.py
```

## 🚀 Advanced Usage

### Custom Categorization

Edit `src/utils.py` to customize URL categorization:

```python
def categorize_url(url: str) -> tuple[int, str]:
    # Add custom logic here
    if "my-domain.com" in url:
        return (6, "A")  # New major category
    # ...
```

### Multiple Symbols

For sources with many supplemental materials:

- `3.CB†` - Primary document
- `3.CB‡` - Supplemental video
- `3.CB*` - Code sample
- `3.CB✱` - TODO marker

### Cross-Referencing

In issues and living document:

```markdown
Related sources: [1.A†], [2.BA], [3.CB†]
```

Creates a knowledge graph across patents, papers, and repos.

## 📈 Monitoring

### GitHub Project Board

Create a Project with columns:

- 📥 **Inbox** (label: `needs-review`)
- 👀 **In Progress** (label: `in-progress`)
- ✅ **Approved** (label: `approved`)
- ❌ **Rejected** (label: `rejected`)
- 📚 **Archived** (label: `archived`)

### Statistics

Track in `docs/living-document.md`:

- Total sources ingested
- Sources reviewed vs. pending
- Sources per category

## 🔒 Security

- **No credentials in code** - Use GitHub Secrets
- **Read-only raw files** - Stored in Git (or Git LFS)
- **Audit trail** - All changes tracked via Git
- **Rate limiting** - Respectful HTTP headers

## 🤝 Contributing

1. Add URLs to `urls.txt`
2. Review created issues
3. Update `docs/living-document.md`
4. Improve categorization logic in `src/utils.py`

## 📄 License

Part of the AI Workflow Platform - MIT License

---

**Built for**: Space-Tor, Spiralverse, and related research  
**Maintained by**: Living Document Review System  
**Version**: 1.0.0
