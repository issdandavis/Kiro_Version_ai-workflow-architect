#!/usr/bin/env python3
"""
Ingest every URL from urls.txt, fetch the content, extract metadata,
store raw blob and JSON, then open a GitHub Issue with a stable ID.

Usage:
    python src/ingest.py

Environment Variables:
    GITHUB_REPOSITORY - Full repo name (e.g., "owner/repo")
    GITHUB_TOKEN or GH_TOKEN - GitHub personal access token
"""

import os
import sys
import json
import pathlib
import requests
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

# Add src to path for imports
sys.path.insert(0, str(pathlib.Path(__file__).parent))

try:
    from github import Github
except ImportError:
    print("⚠️  PyGithub not installed. Run: pip install PyGithub", file=sys.stderr)
    sys.exit(1)

from utils import slugify, assign_id, categorize_url, extract_title_from_html, extract_github_info


BASE_PATH = pathlib.Path(__file__).parent.parent
REPO_NAME = os.getenv("GITHUB_REPOSITORY")
TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")


def load_urls() -> list[str]:
    """Load URLs from urls.txt, skipping comments and empty lines."""
    urls_file = BASE_PATH / "urls.txt"
    if not urls_file.exists():
        print(f"⚠️  urls.txt not found at {urls_file}", file=sys.stderr)
        print("ℹ️  Create urls.txt and add URLs (one per line) to get started.", file=sys.stderr)
        print("ℹ️  See docs/QUICK_START_LIVING_DOCS.md for examples.", file=sys.stderr)
        return []
    
    urls = []
    for line in urls_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    
    return urls


def fetch_content(url: str) -> tuple[bytes, str]:
    """
    Fetch content from URL.
    
    Returns:
        Tuple of (content bytes, content-type)
    """
    headers = {
        "User-Agent": "SpaceTorBot/1.0 (Living Document Review System)"
    }
    
    try:
        response = requests.get(url, timeout=30, headers=headers, allow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")
        return response.content, content_type
    except Exception as e:
        raise Exception(f"Failed to fetch {url}: {str(e)}")


def store_raw(uid: str, content: bytes, content_type: str) -> str:
    """
    Store raw content to data/raw/ directory.
    
    Returns:
        Filename of stored content
    """
    raw_dir = BASE_PATH / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine file extension
    if "pdf" in content_type.lower():
        ext = ".pdf"
    elif "html" in content_type.lower():
        ext = ".html"
    else:
        ext = ".bin"
    
    filename = f"{uid}{ext}"
    filepath = raw_dir / filename
    filepath.write_bytes(content)
    
    return filename


def extract_metadata(url: str, content: bytes, content_type: str, raw_file: str) -> dict:
    """
    Extract metadata from content.
    
    Returns:
        Metadata dictionary
    """
    meta = {
        "url": url,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "content_type": content_type,
        "raw_file": raw_file,
        "title": "",
        "authors": [],
    }
    
    # Extract title from HTML
    if "html" in content_type.lower():
        meta["title"] = extract_title_from_html(content)
    
    # Extract GitHub info (with strict hostname validation)
    parsed_url = urlparse(url)
    if parsed_url.netloc == "github.com" or parsed_url.netloc.endswith(".github.com"):
        github_info = extract_github_info(url)
        meta["github"] = github_info
        if not meta["title"]:
            meta["title"] = f"{github_info.get('owner', '')}/{github_info.get('repo', '')}"
    
    return meta


def create_issue(gh: Github, repo, issue_id: str, title: str, url: str, meta: dict, major: int, section: str) -> Optional[object]:
    """
    Create a GitHub issue for the source.
    
    Returns:
        Created issue object or None
    """
    body = f"""**Source ID**: `{issue_id}`  
**URL**: {url}  
**Fetched**: {meta["fetched_at"]}  
**Content-type**: {meta["content_type"]}  
**Raw file**: `data/raw/{meta["raw_file"]}`  

---

### TL;DR (to be filled)

> _Add a short 2-sentence summary here describing the key findings or relevance._

### Key Points

- [ ] Verify title and authors
- [ ] Tag with appropriate taxonomy labels
- [ ] Link to related items (see [taxonomy.md](../docs/taxonomy.md))
- [ ] Add summary to [living-document.md](../docs/living-document.md)

### Related Sources

_List related source IDs here (e.g., [1.A†], [2.BA])_

---

*Generated automatically by `src/ingest.py` - Living Document Review System*
"""
    
    try:
        # Check if issue already exists using search API for efficiency
        search_query = f"repo:{repo.full_name} [{issue_id}] in:title"
        existing = gh.search_issues(search_query)
        
        if existing.totalCount > 0:
            existing_issue = existing[0]
            print(f"ℹ️  Issue already exists for {issue_id}: #{existing_issue.number}")
            return existing_issue
        
        # Create new issue
        labels = [f"major-{major}", f"section-{section}", "needs-review"]
        issue = repo.create_issue(
            title=f"[{issue_id}] {title or 'Untitled Source'}",
            body=body,
            labels=labels
        )
        print(f"✅ Created issue #{issue.number} → {issue_id}: {title}")
        return issue
    except Exception as e:
        print(f"⚠️  Failed to create issue for {issue_id}: {e}", file=sys.stderr)
        return None


def main():
    """Main ingestion function."""
    if not REPO_NAME:
        print("⚠️  GITHUB_REPOSITORY environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    if not TOKEN:
        print("⚠️  GITHUB_TOKEN or GH_TOKEN environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    # Initialize GitHub client
    try:
        gh = Github(TOKEN)
        repo = gh.get_repo(REPO_NAME)
        print(f"📚 Connected to repository: {REPO_NAME}")
    except Exception as e:
        print(f"⚠️  Failed to connect to GitHub: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Load URLs
    urls = load_urls()
    if not urls:
        print("ℹ️  No URLs to process")
        return
    
    print(f"📋 Found {len(urls)} URLs to process")
    
    # Track sources by category for ID assignment
    category_counts = {}
    
    # Process each URL
    for idx, url in enumerate(urls):
        print(f"\n[{idx + 1}/{len(urls)}] Processing: {url}")
        
        # Categorize URL
        major, section = categorize_url(url)
        category_key = f"{major}.{section}"
        
        # Track position within category
        if category_key not in category_counts:
            category_counts[category_key] = 0
        position = category_counts[category_key]
        category_counts[category_key] += 1
        
        # Generate ID
        issue_id = assign_id(position, major, section)
        
        try:
            # Fetch content
            print(f"  📥 Fetching content...")
            content, content_type = fetch_content(url)
            
            # Store raw content
            print(f"  💾 Storing raw content...")
            raw_file = store_raw(issue_id, content, content_type)
            
            # Extract metadata
            print(f"  🔍 Extracting metadata...")
            meta = extract_metadata(url, content, content_type, raw_file)
            
            # Store metadata JSON
            meta_path = BASE_PATH / "data" / "meta" / f"{issue_id}.json"
            meta_path.parent.mkdir(parents=True, exist_ok=True)
            meta_path.write_text(json.dumps(meta, indent=2))
            
            # Create GitHub issue
            print(f"  📝 Creating GitHub issue...")
            create_issue(gh, repo, issue_id, meta.get("title", ""), url, meta, major, section)
            
        except Exception as e:
            print(f"  ⚠️  Failed: {e}", file=sys.stderr)
            continue
    
    print(f"\n✅ Ingestion complete! Processed {len(urls)} URLs")


if __name__ == "__main__":
    main()
