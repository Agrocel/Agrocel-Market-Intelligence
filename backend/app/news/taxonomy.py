"""
Bromine Market News Taxonomy & Search Terms Helper
Loads configurable keywords, competitors, event categories, and negative exclusion rules from YAML.
"""

import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
import yaml

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "bromine_news_taxonomy.yaml"

class NewsTaxonomy:
    """Manages search terms, competitor aliases, negative filters, and taxonomy mapping."""

    def __init__(self, config_file: Optional[Path] = None):
        self.config_path = config_file or CONFIG_PATH
        self._data: Dict[str, Any] = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if not self.config_path.exists():
            return {}
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            print(f"[TAXONOMY ERROR] Failed to load config from {self.config_path}: {e}")
            return {}

    @property
    def product_keywords(self) -> List[str]:
        return self._data.get("product_keywords", ["bromine", "elemental bromine", "hydrobromic acid", "flame retardant"])

    @property
    def competitors(self) -> List[Dict[str, Any]]:
        return self._data.get("competitors", [])

    @property
    def geographies(self) -> Dict[str, Any]:
        return self._data.get("geographies", {})

    @property
    def event_categories(self) -> Dict[str, Any]:
        return self._data.get("event_categories", {})

    @property
    def negative_exclusion_keywords(self) -> List[str]:
        return self._data.get("negative_exclusion_keywords", [])

    @property
    def relevance_scoring(self) -> Dict[str, Any]:
        return self._data.get("relevance_scoring", {
            "min_threshold": 0.40,
            "high_relevance_threshold": 0.70,
            "weights": {
                "product_keyword_match": 0.40,
                "competitor_match": 0.25,
                "event_keyword_match": 0.20,
                "chemical_market_context": 0.15
            }
        })

    def get_gdelt_queries(self) -> List[str]:
        """Generates focused search queries tailored for GDELT DOC 2.0 API."""
        return [
            "bromine",
            "bromine price",
            "bromine plant",
            "bromine capacity",
            "elemental bromine",
            "brominated flame retardant",
            "hydrobromic acid",
            "tetrabromobisphenol"
        ]

    def match_competitors(self, text: str) -> List[Dict[str, Any]]:
        """Identifies any competitor mentions and aliases in the given text."""
        lowered = text.lower()
        matched = []
        for comp in self.competitors:
            name = comp.get("name", "")
            aliases = comp.get("aliases", [])
            all_terms = [name] + aliases
            for term in all_terms:
                if term.lower() in lowered:
                    matched.append(comp)
                    break
        return matched

    def match_geography(self, text: str) -> str:
        """Determines the primary region based on geographic keyword occurrences."""
        lowered = text.lower()
        matched_regions: Dict[str, int] = {}

        for region, info in self.geographies.items():
            keywords = info.get("keywords", [])
            count = sum(1 for kw in keywords if kw.lower() in lowered)
            if count > 0:
                matched_regions[region] = count

        if not matched_regions:
            return "Global"

        # Return region with highest match count
        return max(matched_regions.items(), key=lambda x: x[1])[0]

    def match_event_category(self, text: str) -> str:
        """Identifies the most prominent event category based on keyword density."""
        lowered = text.lower()
        cat_scores: Dict[str, int] = {}

        for cat, details in self.event_categories.items():
            keywords = details.get("keywords", [])
            score = sum(1 for kw in keywords if kw.lower() in lowered)
            if score > 0:
                cat_scores[cat] = score

        if not cat_scores:
            return "GENERAL_MARKET"

        return max(cat_scores.items(), key=lambda x: x[1])[0]

# Singleton instance
news_taxonomy = NewsTaxonomy()
