"""
Utility functions for the Living Document Review system.
"""

import hashlib
from urllib.parse import urlparse

# Constants for ID generation
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
SYMBOLS = ["†", "‡", "*", "✱"]


def slugify(url: str) -> str:
    """Generate a deterministic short hash for a URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:8]


def assign_id(idx: int, major: int, section: str) -> str:
    """
    Generate a unique ID in the format: <Major>.<Section><Letter><Symbol>
    
    Args:
        idx: Zero-based position within the section
        major: Major category (1-5)
        section: Section letter (A-Z)
    
    Returns:
        ID string like "3.CB†"
    
    Note:
        If idx exceeds 26 items per section, symbols are added in order.
        After exhausting all 26*4=104 combinations, symbols repeat (e.g., ††).
    """
    # Calculate letter position (cycles through A-Z)
    letter_idx = idx % len(LETTERS)
    letter = LETTERS[letter_idx]
    
    # Calculate symbol for items beyond the first 26
    symbol_group = idx // len(LETTERS)
    
    if symbol_group > 0:
        # Symbol index within the available symbols
        symbol_idx = (symbol_group - 1) % len(SYMBOLS)
        symbol_repeat = ((symbol_group - 1) // len(SYMBOLS)) + 1
        symbol = SYMBOLS[symbol_idx] * symbol_repeat
    else:
        symbol = ""
    
    return f"{major}.{section}{letter}{symbol}"


def categorize_url(url: str) -> tuple[int, str]:
    """
    Categorize a URL into major category and section.
    
    Args:
        url: The URL to categorize
    
    Returns:
        Tuple of (major, section) like (3, "C")
    """
    parsed = urlparse(url)
    url_lower = url.lower()
    
    # Patents & IP Filings (Major = 1)
    if parsed.netloc == "patents.google.com" or parsed.netloc.endswith(".patents.google.com") or "patent" in url_lower:
        if any(k in url_lower for k in ["debris", "orbital", "space"]):
            return (1, "A")  # Space Debris
        elif any(k in url_lower for k in ["quantum", "qkd", "key-exchange"]):
            return (1, "B")  # Quantum Key Exchange
        elif any(k in url_lower for k in ["swarm", "nav", "formation"]):
            return (1, "C")  # Swarm Navigation
        else:
            return (1, "A")  # Default to Space Debris
    
    # Academic Papers (Major = 2)
    elif any(parsed.netloc == k or parsed.netloc.endswith(f".{k}") for k in ["arxiv.org", "acm.org", "ieee.org"]) or "paper" in url_lower:
        if any(k in url_lower for k in ["quantum", "pqc", "post-quantum"]):
            return (2, "A")  # Quantum Computing
        elif any(k in url_lower for k in ["routing", "spatial", "topology"]):
            return (2, "B")  # Spatial Routing
        elif any(k in url_lower for k in ["crypto", "encryption", "protocol"]):
            return (2, "C")  # Cryptographic Protocols
        else:
            return (2, "A")  # Default to Quantum Computing
    
    # GitHub Repositories (Major = 3)
    elif parsed.netloc == "github.com" or parsed.netloc.endswith(".github.com"):
        if any(k in url_lower for k in ["spiralverse", "sdk"]):
            return (3, "A")  # Spiralverse SDK
        elif any(k in url_lower for k in ["space-tor", "router", "tor"]):
            return (3, "B")  # Space-Tor Router
        elif any(k in url_lower for k in ["combat", "network", "protocol"]):
            return (3, "C")  # Combat Network
        else:
            return (3, "A")  # Default to Spiralverse SDK
    
    # Industry News (Major = 4)
    elif any(parsed.netloc == k or parsed.netloc.endswith(f".{k}") for k in ["spacenews.com", "space.com"]) or "news" in url_lower:
        if any(k in url_lower for k in ["astroscale"]):
            return (4, "A")  # Astroscale
        elif any(k in url_lower for k in ["seraphim"]):
            return (4, "B")  # Seraphim
        elif any(k in url_lower for k in ["spacex", "space-x"]):
            return (4, "C")  # SpaceX
        else:
            return (4, "A")  # Default to Astroscale
    
    # Internal Tools (Major = 5)
    elif any(k in url_lower for k in ["firebase", "perplexity", "workflow", "internal"]):
        if any(k in url_lower for k in ["perplexity", "memory"]):
            return (5, "A")  # Perplexity Memory
        elif any(k in url_lower for k in ["workflow", "architect"]):
            return (5, "B")  # Workflow Architect
        else:
            return (5, "A")  # Default to Perplexity Memory
    
    # Default: categorize as GitHub repos
    return (3, "A")


def extract_title_from_html(content: bytes) -> str:
    """
    Extract title from HTML content.
    
    Args:
        content: Raw HTML bytes
    
    Returns:
        Extracted title or empty string
    """
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(content, "html.parser")
        if soup.title and soup.title.string:
            return soup.title.string.strip()
    except Exception:
        pass
    return ""


def extract_github_info(url: str) -> dict:
    """
    Extract owner and repo from GitHub URL.
    
    Args:
        url: GitHub URL
    
    Returns:
        Dict with 'owner' and 'repo' keys
    """
    parsed = urlparse(url)
    # Strict hostname check for security
    if parsed.netloc == "github.com" or parsed.netloc.endswith(".github.com"):
        parts = parsed.path.strip("/").split("/")
        if len(parts) >= 2:
            return {"owner": parts[0], "repo": parts[1]}
    return {"owner": "", "repo": ""}
