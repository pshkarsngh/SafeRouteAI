import json
from app.config import settings


class LLMService:
    """LLM service for preference parsing and route explanation."""

    def __init__(self):
        self._llm = None
        self._init_llm()

    def _init_llm(self):
        if settings.openai_api_key:
            try:
                from langchain_openai import ChatOpenAI
                self._llm = ChatOpenAI(
                    model=settings.llm_model_openai,
                    temperature=settings.llm_temperature,
                    api_key=settings.openai_api_key,
                )
                return
            except Exception:
                pass

        if settings.gemini_api_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._llm = ChatGoogleGenerativeAI(
                    model=settings.llm_model_gemini,
                    temperature=settings.llm_temperature,
                    google_api_key=settings.gemini_api_key,
                )
                return
            except Exception:
                pass

        self._llm = None

    @property
    def available(self) -> bool:
        return self._llm is not None

    async def parse_preferences(self, text: str) -> dict:
        """
        Parse natural language user preferences into structured routing requirements.
        Returns: {alpha, avoidClasses, priority, raw_text}
        """
        if not text.strip():
            return {"alpha": 0.5, "avoidClasses": [], "priority": "balanced", "raw_text": ""}

        if not self.available:
            return self._mock_parse(text)

        prompt = f"""You are a road safety navigation assistant. Parse the user's routing preference into a JSON object.

User preference: "{text}"

Return ONLY a JSON object with these keys:
- "alpha": float between 0 and 1 (0=fastest route, 1=safest route). Default 0.5.
- "avoidClasses": list of hazard types to avoid. Possible values: ["pothole", "crack", "damaged", "waterlogged", "uneven"]
- "priority": one of "safety", "speed", "balanced"
- "raw_text": the original user text

Rules:
- If user mentions "safe", "safest", "avoid potholes", "no bumps" -> alpha >= 0.7
- If user mentions "fast", "quick", "shortest" -> alpha <= 0.3
- If user says "avoid potholes" -> include "pothole" in avoidClasses
- If user says "avoid water" or "flooded" -> include "waterlogged" in avoidClasses
- If no preference -> alpha=0.5, avoidClasses=[], priority="balanced"

Return ONLY valid JSON, no explanation."""

        try:
            result = await self._llm.ainvoke(prompt)
            content = result.content.strip()
            content = content.removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(content)

            parsed.setdefault("alpha", 0.5)
            parsed.setdefault("avoidClasses", [])
            parsed.setdefault("priority", "balanced")
            parsed["raw_text"] = text
            return parsed

        except Exception:
            return self._mock_parse(text)

    async def explain_route(
        self,
        selected_route: dict,
        other_routes: list[dict],
        preferences: str,
        hazard_summary: dict,
    ) -> str:
        """Generate natural language explanation for the selected route."""
        if not self.available:
            return self._mock_explain(selected_route, other_routes, preferences, hazard_summary)

        other_info = ""
        for r in other_routes[:2]:
            other_info += f"\n- Route {r.get('index', '?')}: safety={r.get('safety_score', 0)}/100, time={r.get('duration', 'N/A')}, hazards={r.get('hazard_count', 0)}"

        prompt = f"""You are a road safety navigation assistant. Explain why this route was recommended.

SELECTED ROUTE:
- Safety Score: {selected_route.get('safety_score', 0)}/100
- Travel Time: {selected_route.get('duration', 'N/A')}
- Distance: {selected_route.get('distance', 'N/A')}
- Hazards detected: {selected_route.get('hazard_count', 0)}
- Hazard types: {json.dumps(hazard_summary)}

OTHER ROUTES CONSIDERED:{other_info}

User Preferences: "{preferences}"

Write a clear, friendly 2-3 sentence explanation. Mention:
1. Why this route was chosen (safety vs time trade-off)
2. Key hazards avoided or present
3. How it compares to alternatives

Keep it concise and helpful. Do not use markdown."""

        try:
            result = await self._llm.ainvoke(prompt)
            return result.content.strip()
        except Exception:
            return self._mock_explain(selected_route, other_routes, preferences, hazard_summary)

    def _mock_parse(self, text: str) -> dict:
        text_lower = text.lower()

        alpha = 0.5
        if any(w in text_lower for w in ["safe", "safest", "avoid", "careful", "cautious"]):
            alpha = 0.8
        elif any(w in text_lower for w in ["fast", "quick", "shortest", "fastest", "hurry"]):
            alpha = 0.2

        avoid = []
        if "pothole" in text_lower or "bump" in text_lower:
            avoid.append("pothole")
        if "crack" in text_lower:
            avoid.append("crack")
        if "water" in text_lower or "flood" in text_lower or "wet" in text_lower:
            avoid.append("waterlogged")
        if "damage" in text_lower or "broken" in text_lower:
            avoid.append("damaged")
        if "uneven" in text_lower or "rough" in text_lower:
            avoid.append("uneven")

        if alpha > 0.6:
            priority = "safety"
        elif alpha < 0.4:
            priority = "speed"
        else:
            priority = "balanced"

        return {
            "alpha": alpha,
            "avoidClasses": avoid,
            "priority": priority,
            "raw_text": text,
        }

    def _mock_explain(
        self,
        selected: dict,
        others: list[dict],
        preferences: str,
        hazard_summary: dict,
    ) -> str:
        score = selected.get("safety_score", 0)
        hazards = selected.get("hazard_count", 0)
        duration = selected.get("duration", "N/A")
        hazard_types = list(hazard_summary.keys()) if hazard_summary else []

        parts = []
        if score >= 80:
            parts.append(f"This route scores {score}/100 for safety, making it an excellent choice.")
        elif score >= 60:
            parts.append(f"This route scores {score}/100 for safety — a solid option with manageable risks.")
        else:
            parts.append(f"This route scores {score}/100 — proceed with caution.")

        if hazards == 0:
            parts.append("No significant road hazards were detected along this path.")
        elif hazards <= 3:
            parts.append(f"Only {hazards} minor hazard(s) detected" + (f" ({', '.join(hazard_types)})." if hazard_types else "."))
        else:
            parts.append(f"{hazards} hazards detected" + (f" including {', '.join(hazard_types)}" if hazard_types else "") + ".")

        if others:
            faster = [o for o in others if o.get("duration", "") < duration]
            if faster:
                parts.append(f"Some alternative routes are faster but have lower safety scores.")

        if preferences:
            parts.append(f"Optimized for your preference: \"{preferences}\".")

        return " ".join(parts)


llm_service = LLMService()
