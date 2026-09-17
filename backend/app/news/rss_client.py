"""
RSS 2.0 & Atom Feed Parser
Fetches and parses syndication feeds using Python's standard library xml.etree.ElementTree.
Handles namespaces, CDATA blocks, and heterogeneous feed schemas.
"""

import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional

DEFAULT_RSS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
}

class RssFeedClient:
    """Client for ingesting chemical industry RSS and Atom feeds."""

    def __init__(self, timeout_seconds: int = 4):
        self.timeout = timeout_seconds

    def fetch_feed(self, feed_url: str, publisher_name: str = "") -> List[Dict[str, Any]]:
        """Fetches XML feed content and returns normalized item dictionaries."""
        if not feed_url:
            return []

        try:
            req = urllib.request.Request(feed_url, headers=DEFAULT_RSS_HEADERS)
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status != 200:
                    print(f"[RSS WARNING] Status {resp.status} fetching {feed_url}")
                    return []
                xml_content = resp.read()
        except Exception as e:
            print(f"[RSS ERROR] Failed to fetch feed {feed_url}: {e}")
            return []

        return self.parse_xml(xml_content, publisher_name)

    def parse_xml(self, xml_content: bytes, default_publisher: str = "") -> List[Dict[str, Any]]:
        """Parses RSS or Atom XML content into raw item dictionaries."""
        items: List[Dict[str, Any]] = []
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as pe:
            print(f"[RSS XML PARSE ERROR] {pe}. Attempting regex fallback.")
            return self._regex_fallback_parse(xml_content.decode("utf-8", errors="ignore"), default_publisher)

        # Remove XML namespace prefixes for easy tag matching
        for elem in root.iter():
            if "}" in elem.tag:
                elem.tag = elem.tag.split("}", 1)[1]

        # 1. Check RSS 2.0 (<rss><channel><item>...</item></channel></rss>)
        channel_items = root.findall(".//item")
        if channel_items:
            for it in channel_items:
                title = it.findtext("title") or ""
                link = it.findtext("link") or ""
                description = it.findtext("description") or ""
                pub_date = it.findtext("pubDate") or it.findtext("date") or ""
                items.append({
                    "title": title.strip(),
                    "url": link.strip(),
                    "snippet": description.strip(),
                    "published_at": pub_date.strip(),
                    "publisher": default_publisher
                })
            return items

        # 2. Check Atom (<feed><entry>...</entry></feed>)
        entries = root.findall(".//entry")
        if entries:
            for entry in entries:
                title = entry.findtext("title") or ""
                link_elem = entry.find("link")
                link = link_elem.attrib.get("href", "") if link_elem is not None else ""
                if not link:
                    link = entry.findtext("link") or ""
                summary = entry.findtext("summary") or entry.findtext("content") or ""
                pub_date = entry.findtext("updated") or entry.findtext("published") or ""
                items.append({
                    "title": title.strip(),
                    "url": link.strip(),
                    "snippet": summary.strip(),
                    "published_at": pub_date.strip(),
                    "publisher": default_publisher
                })
            return items

        return items

    def _regex_fallback_parse(self, text: str, default_publisher: str) -> List[Dict[str, Any]]:
        """Fallback regex extractor for non-standard XML feeds."""
        items = []
        raw_items = re.findall(r"<item>(.*?)</item>", text, re.DOTALL | re.IGNORECASE)
        for raw in raw_items:
            title_m = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", raw, re.DOTALL | re.IGNORECASE)
            link_m = re.search(r"<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>", raw, re.DOTALL | re.IGNORECASE)
            desc_m = re.search(r"<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>", raw, re.DOTALL | re.IGNORECASE)
            pub_m = re.search(r"<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</pubDate>", raw, re.DOTALL | re.IGNORECASE)

            title = title_m.group(1).strip() if title_m else ""
            link = link_m.group(1).strip() if link_m else ""
            desc = desc_m.group(1).strip() if desc_m else ""
            pub = pub_m.group(1).strip() if pub_m else ""

            if title or link:
                items.append({
                    "title": title,
                    "url": link,
                    "snippet": desc,
                    "published_at": pub,
                    "publisher": default_publisher
                })
        return items

# Singleton instance
rss_client = RssFeedClient()
