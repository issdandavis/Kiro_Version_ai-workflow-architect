#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def detect_provider(model: str) -> str:
    model_lower = model.lower()
    if "claude" in model_lower and os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if "gemini" in model_lower and os.getenv("GOOGLE_API_KEY"):
        return "google"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    return "fallback-static"


def collect_target_snapshot(target: Path, limit: int = 50) -> dict[str, Any]:
    if not target.exists():
        return {"exists": False, "kind": "missing", "items": []}

    if target.is_file():
        try:
            text = target.read_text(encoding="utf-8", errors="ignore")
            line_count = text.count("\n") + 1 if text else 0
        except OSError:
            line_count = None
        return {
            "exists": True,
            "kind": "file",
            "items": [{"path": str(target), "lines": line_count}],
        }

    items: list[dict[str, Any]] = []
    for p in sorted(target.rglob("*")):
        if len(items) >= limit:
            break
        if p.is_dir():
            continue
        items.append({"path": str(p), "suffix": p.suffix})
    return {"exists": True, "kind": "directory", "items": items}


def make_recommendations(agent_type: str, snapshot: dict[str, Any]) -> list[str]:
    recs: list[str] = []
    if not snapshot.get("exists"):
        return [f"Target does not exist. Review path and rerun {agent_type}."]

    if snapshot.get("kind") == "directory":
        item_count = len(snapshot.get("items", []))
        recs.append(f"Indexed {item_count} files for {agent_type} analysis.")
    else:
        recs.append(f"Collected single-file snapshot for {agent_type} analysis.")

    recs.append("Workflow execution is healthy: runner script found and produced logs.")
    recs.append("Next step: wire provider-specific prompting for non-fallback models.")
    return recs


def main() -> int:
    parser = argparse.ArgumentParser(description="AI workflow agent runner.")
    parser.add_argument("--agent-type", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--output-format", choices=["json", "text"], default="json")
    args = parser.parse_args()

    target = Path(args.target).resolve()
    provider = detect_provider(args.model)
    snapshot = collect_target_snapshot(target)
    recommendations = make_recommendations(args.agent_type, snapshot)

    result = {
        "timestamp": now_iso(),
        "agent_type": args.agent_type,
        "model": args.model,
        "provider": provider,
        "target": str(target),
        "snapshot": snapshot,
        "recommendations": recommendations,
        "status": "ok",
    }

    out_dir = Path("logs/ai-agents")
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_path = out_dir / f"run-{stamp}.json"
    latest_path = out_dir / "latest.json"
    run_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    latest_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    if args.output_format == "json":
        print(json.dumps(result))
    else:
        print(f"[{result['status']}] {args.agent_type} -> {args.target} ({provider})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
