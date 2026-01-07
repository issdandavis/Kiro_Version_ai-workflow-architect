# Living Document System - Quick Start Guide

This guide will help you get started with the Living Document Review & Automation system in under 5 minutes.

## 🚀 Quick Start (5 Minutes)

### Step 1: Add Your First URLs (1 min)

Edit `urls.txt` and add some research sources:

```bash
# Open urls.txt in your editor
vim urls.txt
```

Example URLs to add:

```text
# Research Papers
https://arxiv.org/abs/2401.00001

# GitHub Repositories
https://github.com/your-org/your-repo

# Patents
https://patents.google.com/patent/US123456

# News Articles
https://spacenews.com/article-title
```

### Step 2: Trigger Ingestion (1 min)

You have two options:

#### Option A: Manual Trigger via GitHub Actions

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Ingest Sources Nightly** workflow
4. Click **Run workflow** button
5. Select the branch (e.g., `main` or your working branch)
6. Click **Run workflow**

#### Option B: Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GITHUB_REPOSITORY="owner/repo"
export GITHUB_TOKEN="ghp_your_token_here"

# Run ingestion
python src/ingest.py
```

### Step 3: Review Created Issues (2 min)

1. Go to your repository's **Issues** tab
2. You'll see new issues created for each URL
3. Each issue has:
   - Unique taxonomy ID (e.g., `[3.CB†]`)
   - Metadata extracted from the source
   - Checklist for review
   - Labels for filtering (`major-X`, `section-Y`, `needs-review`)

### Step 4: Update Living Document (1 min)

1. Open `docs/living-document.md`
2. Find the appropriate section based on the taxonomy
3. Add a summary of the source under that section
4. Commit your changes

Example:

```markdown
### 3.B - Space-Tor Router

#### [3.BA] Space-Tor Core Router
- **Summary**: Core router implementation for Space-Tor network
- **Status**: Active development
- **Key Features**: Quantum-resistant routing, mesh topology
- **Issue**: #123
```

## 📊 What Happens Next?

- **Nightly Sync**: The system runs automatically at 02:00 UTC
- **Firebase Sync**: Changes to `living-document.md` trigger Firebase sync
- **Issue Tracking**: Use GitHub Projects to track review progress
- **Git History**: All changes are version controlled

## 🎯 Common Tasks

### Adding New Categories

Edit `src/utils.py` to add custom categorization:

```python
def categorize_url(url: str) -> tuple[int, str]:
    # Add your custom logic
    if "my-domain.com" in url:
        return (6, "A")  # New major category
    # ...
```

### Manual Ingestion

```bash
# Ingest a single URL (test mode)
python src/ingest.py
```

### Check Workflow Status

```bash
# View workflow runs
gh workflow list
gh workflow view "Ingest Sources Nightly"
gh run list --workflow="Ingest Sources Nightly"
```

### View Raw Data

```bash
# View stored metadata
cat data/meta/3.BA.json | jq .

# List all ingested sources
ls -lh data/raw/
ls -lh data/meta/
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file (don't commit this!):

```bash
GITHUB_REPOSITORY=owner/repo
GITHUB_TOKEN=ghp_xxxxx
FIREBASE_CONFIG={"projectId": "..."}
FIREBASE_SERVICE_ACCOUNT={"type": "service_account", ...}
```

### GitHub Secrets

Configure in **Settings → Secrets → Actions**:

- `GITHUB_TOKEN` - Automatically provided
- `FIREBASE_CONFIG` - Firebase project config
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account

## 📈 Monitoring

### Check Ingestion Status

```bash
# View recent workflow runs
gh run list --workflow="Ingest Sources Nightly" --limit 5

# View logs for a specific run
gh run view [RUN_ID] --log
```

### Statistics

```bash
# Count ingested sources
ls data/meta/*.json | wc -l

# Count by category
grep -h '"major":' data/meta/*.json | sort | uniq -c
```

## 🐛 Troubleshooting

### Issue: Python dependencies not installed

```bash
pip install -r requirements.txt
```

### Issue: GitHub token not working

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Create token with `repo` and `workflow` scopes
3. Set `GITHUB_TOKEN` environment variable

### Issue: Workflow not triggering

1. Check workflow permissions in Settings → Actions → General
2. Ensure "Allow GitHub Actions to create and approve pull requests" is enabled
3. Verify branch name matches workflow trigger

### Issue: Firebase sync not working

1. Configure `FIREBASE_CONFIG` secret
2. Configure `FIREBASE_SERVICE_ACCOUNT` secret
3. Check workflow logs for errors

## 📚 Next Steps

1. **Review Documentation**: Read [LIVING_DOCUMENT_SYSTEM.md](LIVING_DOCUMENT_SYSTEM.md)
2. **Set Up Project Board**: Create GitHub Project for issue tracking
3. **Customize Taxonomy**: Add your own categories in `docs/taxonomy.md`
4. **Configure Firebase**: Enable Firebase sync for real-time updates
5. **Add More Sources**: Build your knowledge base!

## 💡 Pro Tips

- Use labels to filter issues by category
- Add `related-to: [ID]` in issue comments to cross-reference
- Export data to JSON for external tools
- Use GitHub's search to find sources: `is:issue label:major-3`
- Archive reviewed sources with `archived` label

## 🤝 Need Help?

- Check the [main documentation](LIVING_DOCUMENT_SYSTEM.md)
- Look at example issues in the repository
- Review the workflow logs in GitHub Actions
- Test locally with sample URLs first

---

**Happy Researching!** 🚀
