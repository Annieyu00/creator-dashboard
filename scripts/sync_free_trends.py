#!/usr/bin/env python3
"""Free public hot-board sync for XX Studio. No secrets, no fabricated data."""
import datetime as dt
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)
NOW = dt.datetime.now(dt.timezone.utc).isoformat()
UA = "XX-Studio-Trends/1.0 (+https://github.com/Annieyu00/creator-dashboard)"
SOURCES = {
    "douyin": [
        ("UAPI", "https://uapis.cn/api/v1/misc/hotboard?type=douyin"),
        ("60s API", "https://60s.viki.moe/v2/douyin"),
    ],
    "xiaohongshu": [
        ("UAPI", "https://uapis.cn/api/v1/misc/hotboard?type=xiaohongshu"),
        ("60s API", "https://60s.viki.moe/v2/xiaohongshu"),
    ],
}

def download(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read(1_000_001)
    if len(body) > 1_000_000:
        raise ValueError("oversized JSON response")
    return json.loads(body)

def locate_rows(raw):
    """Support common vendor payload envelopes; reject error/status placeholders."""
    if isinstance(raw, list):
        return raw
    if not isinstance(raw, dict):
        raise ValueError("not a JSON object or array")
    if raw.get("success") is False or raw.get("code") in (-1, 400, 401, 403, 404, 429, 500):
        raise ValueError("source returned an error status")
    for key in ("data", "list", "items", "result", "hot_list", "hotlist", "hotboard", "realtime", "word_list"):
        candidate = raw.get(key)
        if isinstance(candidate, list):
            return candidate
        if isinstance(candidate, dict):
            try:
                return locate_rows(candidate)
            except ValueError:
                pass
    raise ValueError("no identifiable hot-list array")

def string(value, limit=200):
    if value is None or isinstance(value, (dict, list)):
        return ""
    return str(value).strip()[:limit]

def normalize(raw, source):
    rows = locate_rows(raw)
    if len(rows) == 0:
        raise ValueError("empty hot-list")
    items, seen = [], set()
    for position, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        title = next((string(row.get(k)) for k in ("title", "name", "word", "keyword", "hot_word", "text") if string(row.get(k))), "")
        if not title or title in seen:
            continue
        url = next((string(row.get(k), 2000) for k in ("url", "link", "source_url", "mobile_url") if string(row.get(k)).startswith("https://")), "")
        # Keep only explicit https URLs. Never invent a platform source URL.
        heat = next((string(row.get(k), 80) for k in ("hot", "hot_value", "heat", "score", "hotness", "hot_text") if row.get(k) is not None), "")
        rank = row.get("rank", row.get("index", position + 1))
        try:
            rank = int(rank)
        except (TypeError, ValueError):
            rank = position + 1
        seen.add(title)
        items.append({"title": title, "url": url, "heat": heat, "rank": rank, "source": source})
        if len(items) >= 30:
            break
    if not items:
        raise ValueError("no valid titled items")
    # Reject obviously non-trend error payloads masquerading as items.
    return items

def sync(platform):
    path = OUT / (platform + ".json")
    problems = []
    for provider, url in SOURCES[platform]:
        try:
            payload = download(url)
            items = normalize(payload, provider)
            data = {"status": "live", "platform": platform, "source": provider,
                    "source_endpoint": url, "fetched_at": NOW, "items": items}
            temp = path.with_suffix(".tmp")
            temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temp.replace(path)
            print(f"{platform}: {len(items)} live items from {provider}")
            return True
        except Exception as exc:
            error = f"{provider}: {type(exc).__name__}: {str(exc)[:160]}"
            problems.append(error)
            print(f"{platform}: {error}", file=sys.stderr)
    # Preserve the last good snapshot; no empty overwrite on failure.
    if not path.exists():
        path.write_text(json.dumps({"status": "unavailable", "platform": platform,
            "fetched_at": None, "items": []}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return False

if __name__ == "__main__":
    outcomes = {p: sync(p) for p in SOURCES}
    print("Sync result:", outcomes)
    if not any(outcomes.values()):
        sys.exit("No provider returned validated data; existing snapshots preserved")
