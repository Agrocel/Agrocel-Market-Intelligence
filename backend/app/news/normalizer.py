"""
News Article Normalizer
Strips tracking parameters, canonicalizes URLs, parses heterogeneous date formats,
cleans HTML entities, and extracts geography mentions.
"""

import re
import hashlib
import html
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from typing import Optional, Dict, Any

from .taxonomy import news_taxonomy

# Known tracking query params to strip
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "fbclid", "gclid", "msclkid", "ref", "referrer", "source",
    "_ga", "_gl", "mc_cid", "mc_eid"
}

class ArticleNormalizer:
    """Utility class to clean and normalize raw news article payloads."""

    @staticmethod
    def clean_text(text: Optional[str]) -> str:
        """Strips HTML tags, decodes entities, and collapses excessive whitespace."""
        if not text:
            return ""
        # Unescape HTML entities first (&amp;, &quot;, &#39;, etc.)
        unescaped = html.unescape(text)
        # Remove HTML tags (<p>, <a ...>, etc.)
        no_html = re.sub(r"<[^>]+>", " ", unescaped)
        # Collapse multiple spaces and trim
        cleaned = re.sub(r"\s+", " ", no_html).strip()
        return cleaned

    @staticmethod
    def canonicalize_url(raw_url: Optional[str]) -> str:
        """Strips trackers, normalizes scheme/domain, and removes fragments."""
        if not raw_url:
            return ""
        try:
            parsed = urlparse(raw_url.strip())
            # Normalize scheme and hostname to lowercase
            scheme = parsed.scheme.lower() or "https"
            netloc = parsed.netloc.lower()
            path = parsed.path.rstrip("/") if parsed.path != "/" else "/"

            # Filter query params
            filtered_query = [
                (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
                if k.lower() not in TRACKING_PARAMS
            ]
            new_query = urlencode(filtered_query)

            # Reconstruct URL without fragment
            clean_url = urlunparse((scheme, netloc, path, parsed.params, new_query, ""))
            return clean_url
        except Exception:
            return raw_url.strip()

    @staticmethod
    def compute_url_hash(canonical_url: str) -> str:
        """Computes SHA256 hash of canonical URL for high-speed deduplication."""
        return hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()

    @staticmethod
    def parse_datetime(date_val: Any) -> datetime:
        """Parses various datetime representations into UTC datetime."""
        if isinstance(date_val, datetime):
            return date_val.astimezone(timezone.utc).replace(tzinfo=None) if date_val.tzinfo else date_val

        if not date_val or not isinstance(date_val, str):
            return datetime.utcnow()

        raw = date_val.strip()
        
        # 1. Try ISO formats (2026-09-10T12:00:00Z, etc.)
        for fmt in (
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
            "%Y%m%d%H%M%S",  # GDELT timestamp format
            "%a, %d %b %Y %H:%M:%S %Z",  # RFC 822 (GMT/UTC)
            "%a, %d %b %Y %H:%M:%S %z",
            "%d %b %Y %H:%M:%S %Z",
        ):
            try:
                dt = datetime.strptime(raw, fmt)
                return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt
            except ValueError:
                pass

        # 2. Chinese date format: 2026年09月10日
        cn_match = re.match(r"(\d{4})年(\d{1,2})月(\d{1,2})日", raw)
        if cn_match:
            try:
                y, m, d = cn_match.groups()
                return datetime(int(y), int(m), int(d))
            except Exception:
                pass

        # Default fallback
        return datetime.utcnow()

    @classmethod
    def normalize_payload(cls, item: Dict[str, Any], default_region: str = "Global") -> Dict[str, Any]:
        """Runs full normalization over a raw ingested dictionary."""
        title = cls.clean_text(item.get("title", ""))
        snippet = cls.clean_text(item.get("snippet", "") or item.get("description", "") or item.get("summary", ""))
        raw_url = item.get("url") or item.get("link") or ""
        canonical_url = cls.canonicalize_url(raw_url)
        url_hash = cls.compute_url_hash(canonical_url)
        pub_dt = cls.parse_datetime(item.get("published_at") or item.get("pubDate") or item.get("seendate"))

        full_text_searchable = f"{title} {snippet}"
        geography = news_taxonomy.match_geography(full_text_searchable)
        if geography == "Global" and default_region != "Global":
            geography = default_region

        return {
            "title": title,
            "snippet": snippet,
            "canonical_url": canonical_url,
            "url_hash": url_hash,
            "published_at": pub_dt,
            "publisher": cls.clean_text(item.get("publisher") or item.get("source_domain") or ""),
            "geography": geography,
            "raw_metadata": item
        }
