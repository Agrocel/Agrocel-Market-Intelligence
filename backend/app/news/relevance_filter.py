"""
Bromine Relevance Filter & Audit Logger
Applies chemical market heuristics, strict bromine product checks, competitor detection,
and negative keyword exclusions with full rejection audit logging.
"""

from typing import Dict, Any, List, Tuple
from .taxonomy import news_taxonomy

# Market context keywords that confirm B2B industrial chemical relevance
MARKET_CONTEXT_KEYWORDS = {
    "price", "pricing", "market", "ton", "tonne", "mt", "metric ton",
    "rmb", "usd", "fob", "cif", "capacity", "expansion", "plant",
    "production", "supply", "demand", "export", "import", "customs",
    "shipment", "iso tank", "inventory", "stock", "shanghai", "weifang",
    "shandong", "kutch", "dahej", "dead sea", "flame retardant", "quarterly",
    "ebitda", "margin", "revenue", "guidance"
}

class BromineRelevanceFilter:
    """Evaluates news articles for Bromine domain specificity and relevance."""

    def __init__(self):
        self.taxonomy = news_taxonomy
        self.weights = self.taxonomy.relevance_scoring.get("weights", {
            "product_keyword_match": 0.40,
            "competitor_match": 0.25,
            "event_keyword_match": 0.20,
            "chemical_market_context": 0.15
        })
        self.min_threshold = self.taxonomy.relevance_scoring.get("min_threshold", 0.40)
        self.high_threshold = self.taxonomy.relevance_scoring.get("high_relevance_threshold", 0.70)

    def evaluate(self, title: str, snippet: str) -> Dict[str, Any]:
        """
        Evaluates title and snippet against taxonomy.
        Returns a dict containing:
          - is_relevant: bool
          - score: float (0.0 to 1.0)
          - status: 'accepted' | 'rejected'
          - rejection_reason: Optional[str]
          - matched_keywords: List[str]
          - matched_competitors: List[str]
          - event_category: str
        """
        combined = f"{title} {snippet}".strip()
        lowered = combined.lower()

        if not combined or len(combined) < 15:
            return {
                "is_relevant": False,
                "score": 0.0,
                "status": "rejected",
                "rejection_reason": "EMPTY_OR_INSUFFICIENT_CONTENT",
                "matched_keywords": [],
                "matched_competitors": [],
                "event_category": "UNKNOWN"
            }

        # 1. Check negative exclusion keywords first
        for neg_kw in self.taxonomy.negative_exclusion_keywords:
            if neg_kw.lower() in lowered:
                return {
                    "is_relevant": False,
                    "score": 0.0,
                    "status": "rejected",
                    "rejection_reason": f"EXCLUDED_BY_NEGATIVE_KEYWORD: {neg_kw}",
                    "matched_keywords": [],
                    "matched_competitors": [],
                    "event_category": "EXCLUDED"
                }

        # 2. Check strict Bromine product keywords
        matched_products = []
        for kw in self.taxonomy.product_keywords:
            if kw.lower() in lowered:
                matched_products.append(kw)

        # In pilot, must have at least one product keyword match
        if not matched_products:
            return {
                "is_relevant": False,
                "score": 0.10,
                "status": "rejected",
                "rejection_reason": "NO_BROMINE_PRODUCT_KEYWORD_FOUND",
                "matched_keywords": [],
                "matched_competitors": [],
                "event_category": "GENERAL_CHEMICAL"
            }

        # 3. Check competitor mentions
        matched_comps = self.taxonomy.match_competitors(combined)
        matched_comp_names = [c["name"] for c in matched_comps]

        # 4. Check event category match
        event_cat = self.taxonomy.match_event_category(combined)

        # 5. Check chemical market context terms
        matched_context = [ctx for ctx in MARKET_CONTEXT_KEYWORDS if ctx in lowered]

        # Compute weighted score
        score = 0.0

        # Product match contribution (scaled by presence in title vs snippet)
        title_lowered = title.lower()
        has_product_in_title = any(kw.lower() in title_lowered for kw in matched_products)
        if has_product_in_title:
            score += self.weights.get("product_keyword_match", 0.40)
        else:
            score += self.weights.get("product_keyword_match", 0.40) * 0.75

        # Competitor match contribution
        if matched_comp_names:
            score += self.weights.get("competitor_match", 0.25)

        # Event category match contribution
        if event_cat != "GENERAL_MARKET":
            score += self.weights.get("event_keyword_match", 0.20)
        else:
            score += self.weights.get("event_keyword_match", 0.20) * 0.50

        # Chemical market context contribution
        if matched_context:
            score += min(self.weights.get("chemical_market_context", 0.15), len(matched_context) * 0.05)

        score = round(min(score, 1.0), 2)
        is_relevant = score >= self.min_threshold

        return {
            "is_relevant": is_relevant,
            "score": score,
            "status": "accepted" if is_relevant else "rejected",
            "rejection_reason": None if is_relevant else f"BELOW_RELEVANCE_THRESHOLD: {score} < {self.min_threshold}",
            "matched_keywords": matched_products,
            "matched_competitors": matched_comp_names,
            "event_category": event_cat
        }

# Singleton instance
relevance_filter = BromineRelevanceFilter()
