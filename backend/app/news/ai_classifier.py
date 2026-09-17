"""
AI News Intelligence Classifier & Strategic Synthesis Engine
Extracts structured market intelligence using Gemini AI (with robust causal NLP fallback):
- Event category classification
- Direct vs Indirect impact on Agrocel
- Sentiment (bullish/bearish/neutral for Agrocel)
- Severity score (1-5)
- Strategic implications & management recommendations
"""

import os
import json
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

class NewsIntelligenceClassifier:
    """Classifies market news and synthesizes strategic implications for Agrocel management."""

    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model_name = GEMINI_MODEL
        self._client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            return
        # Try new google.genai SDK
        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
            self._sdk_type = "google.genai"
            return
        except Exception:
            pass

        # Try google.generativeai SDK
        try:
            import google.generativeai as legacy_genai
            clean_key = self.api_key.strip("\"'")
            legacy_genai.configure(api_key=clean_key)
            self._client = legacy_genai.GenerativeModel(self.model_name)
            self._sdk_type = "google.generativeai"
            return
        except Exception as e:
            print(f"[AI CLASSIFIER] Could not init Google Generative AI client: {e}")
            self._client = None
            self._sdk_type = None

    def classify_article(
        self,
        title: str,
        snippet: str,
        publisher: str,
        geography: str,
        matched_competitors: list,
        base_event_category: str
    ) -> Dict[str, Any]:
        """
        Classifies article into structured intelligence.
        Uses Gemini if available, otherwise executes deterministic causal rule engine.
        """
        if self._client:
            try:
                return self._classify_with_gemini(title, snippet, publisher, geography, matched_competitors, base_event_category)
            except Exception as e:
                print(f"[AI CLASSIFIER WARNING] Gemini classification failed: {e}. Using rule fallback.")

        return self._classify_with_rules(title, snippet, publisher, geography, matched_competitors, base_event_category)

    def _classify_with_gemini(
        self,
        title: str,
        snippet: str,
        publisher: str,
        geography: str,
        matched_competitors: list,
        base_event_category: str
    ) -> Dict[str, Any]:
        prompt = f"""You are the Chief Market Intelligence Analyst for Agrocel Industries Private Limited, a major Indian producer of elemental bromine, bromine derivatives, and specialty marine chemicals based in Gujarat (Kutch/Mundra).

Analyze the following market news article and extract structured intelligence:
Title: {title}
Publisher: {publisher}
Geography: {geography}
Matched Competitors: {', '.join(matched_competitors) if matched_competitors else 'None'}
Preliminary Category: {base_event_category}
Snippet/Text: {snippet}

Respond ONLY with a valid JSON object matching this exact schema:
{{
  "event_category": "PRICE" | "CAPACITY" | "SUPPLY" | "DEMAND" | "REGULATION" | "TRADE" | "COMPETITOR_MOVE" | "PLANT_EVENT" | "SAFETY_INCIDENT" | "GENERAL_MARKET",
  "impact_on_agrocel": "direct" | "indirect" | "none",
  "impact_sentiment": "bullish_for_agrocel" | "bearish_for_agrocel" | "neutral_market_signal",
  "severity_score": 1 to 5,
  "confidence_score": 0.5 to 1.0,
  "strategic_implication": "2-3 concise sentences explaining why this event matters to Agrocel's revenue, margins, or market share.",
  "action_recommended": "1 clear, actionable recommendation for Agrocel leadership (e.g. adjust export pricing, contact specific segment buyers, hedge logistics)."
}}
"""
        if getattr(self, "_sdk_type", "") == "google.genai":
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            raw_text = response.text.strip()
        else:
            response = self._client.generate_content(prompt)
            raw_text = response.text.strip()
        # Clean JSON markdown fences if returned
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)

        parsed = json.loads(raw_text)
        return {
            "event_category": parsed.get("event_category", base_event_category),
            "impact_on_agrocel": parsed.get("impact_on_agrocel", "indirect"),
            "impact_sentiment": parsed.get("impact_sentiment", "neutral_market_signal"),
            "severity_score": int(parsed.get("severity_score", 3)),
            "confidence_score": float(parsed.get("confidence_score", 0.85)),
            "strategic_implication": parsed.get("strategic_implication", ""),
            "action_recommended": parsed.get("action_recommended", ""),
            "classification_method": "gemini"
        }

    def _classify_with_rules(
        self,
        title: str,
        snippet: str,
        publisher: str,
        geography: str,
        matched_competitors: list,
        base_event_category: str
    ) -> Dict[str, Any]:
        """High-precision deterministic rule-based fallback."""
        combined = f"{title} {snippet}".lower()

        # Determine sentiment & Agrocel impact
        sentiment = "neutral_market_signal"
        impact = "indirect"
        severity = 3
        implication = ""
        action = "Monitor market developments and track pricing trends in upcoming brief."

        # Competitor expansions in India (Archean, Tata) -> Direct competition
        if "archean" in combined or "tata chemicals" in combined:
            impact = "direct"
            if any(w in combined for w in ["expand", "expansion", "capacity", "increase", "ramp"]):
                sentiment = "bearish_for_agrocel"
                severity = 4
                implication = "Domestic capacity additions by Indian competitors increase local spot supply in Gujarat and western industrial corridors, potentially compressing domestic merchant realization."
                action = "Review domestic quarterly contract terms and reinforce key accounts in Dahej and Gujarat pharma clusters."
            else:
                severity = 3
                implication = f"Competitor operational activity noted for {', '.join(matched_competitors)}. May influence regional merchant product balance."
                action = "Audit comparative realization and seaborne export volumes."

        # China / Shandong supply shutdowns or environmental inspections -> Bullish for Agrocel exports
        elif geography == "China" or any(w in combined for w in ["china", "shandong", "weifang", "laizhou"]):
            if any(w in combined for w in ["shut", "shutdown", "inspection", "curtail", "freeze", "shortage", "audit", "curtailment"]):
                impact = "direct"
                sentiment = "bullish_for_agrocel"
                severity = 4
                implication = "Environmental shutdowns or winter curtailments in Shandong tighten Chinese domestic merchant bromine availability, driving up domestic Chinese spot prices and widening import demand for Indian cargo."
                action = "Assess spot export offers to Chinese flame retardant and intermediate buyers at higher USD CIF parity."
            elif any(w in combined for w in ["price hike", "rises", "rally", "increases", "rose"]):
                sentiment = "bullish_for_agrocel"
                severity = 3
                implication = "Strengthening Chinese bromine benchmarks improves the floor price for seaborne bromine and strengthens Agrocel's export bargaining leverage."
                action = "Leverage firming Chinese spot prices in upcoming export contract negotiations."

        # Global flame retardant demand / regulation
        elif "flame retardant" in combined or "tbba" in combined or "dbdpe" in combined:
            severity = 3
            if any(w in combined for w in ["ban", "restriction", "regulation", "phase-out", "echa"]):
                sentiment = "bearish_for_agrocel"
                severity = 4
                implication = "Regulatory tightening on brominated flame retardants in Europe or US could depress compound off-take in electrical and electronics end-markets."
                action = "Diversify bromine product allocation towards agrochemical intermediates, biocides, and clear brine fluids."
            else:
                sentiment = "bullish_for_agrocel"
                implication = "Active downstream demand in brominated flame retardants supports steady merchant off-take."
                action = "Maintain regular allocation to derivative compounding customers."

        # General high severity events (plant accidents, leaks)
        elif any(w in combined for w in ["incident", "leak", "fire", "explosion", "spill", "force majeure"]):
            severity = 5
            sentiment = "bullish_for_agrocel"
            implication = "Competitor force majeure or plant incident removes merchant capacity from the seaborne trade, prompting spot buyers to seek alternative supply."
            action = "Prepare reserve ISO tank capacity to fulfill urgent customer off-take requests."

        if not implication:
            implication = f"Market event categorized under {base_event_category} in {geography}. Provides macro context for bromine supply/demand dynamics."

        return {
            "event_category": base_event_category,
            "impact_on_agrocel": impact,
            "impact_sentiment": sentiment,
            "severity_score": severity,
            "confidence_score": 0.80,
            "strategic_implication": implication,
            "action_recommended": action,
            "classification_method": "rule_engine"
        }

# Singleton instance
news_classifier = NewsIntelligenceClassifier()
