import math
from app.config import settings, HAZARD_CLASSES
from app.models.prediction import HazardDetection, RouteSegment, RouteAlternative


class SafetyScorer:
    """
    Safety Score computation based on the paper equations (3)-(6).

    Hi,j = sum_{m=1}^{M} gamma_cm * wm * pm   (eq 3)
    Hi = (1/Ni) * sum_j Hi,j                     (eq 4)
    SafetyScore(ri) = 100 * e^(-lambda * Hi)      (eq 5)
    Rank(ri) = alpha * SafetyScore(ri) + (1-alpha) * 100 * tmin/ti  (eq 6)
    """

    def compute_segment_hazard_cost(
        self,
        detections: list[HazardDetection],
        avoid_classes: list[str] | None = None,
    ) -> float:
        """Compute hazard cost for a single segment (eq 3)."""
        cost = 0.0
        for det in detections:
            cls = HAZARD_CLASSES.get(det.class_name)
            if cls is None:
                continue

            gamma = cls["gamma"]
            wm = cls["severity_weight"]
            pm = det.confidence

            # Extra penalty for avoided hazard classes
            if avoid_classes and det.class_name in avoid_classes:
                gamma *= 1.5

            cost += gamma * wm * pm

        return cost

    def compute_route_safety_score(
        self,
        segments: list[RouteSegment],
        avoid_classes: list[str] | None = None,
    ) -> float:
        """Compute Safety Score for an entire route (eqs 3-5)."""
        if not segments:
            return 100.0

        total_hazard_cost = 0.0
        for seg in segments:
            seg_cost = self.compute_segment_hazard_cost(seg.hazards, avoid_classes)
            seg.segment_hazard_cost = seg_cost
            total_hazard_cost += seg_cost

        # Average hazard cost per segment (eq 4)
        avg_hazard_cost = total_hazard_cost / len(segments)

        # Safety Score (eq 5): 0-100, higher is safer
        safety_score = 100 * math.exp(-settings.safety_lambda * avg_hazard_cost)

        return max(0.0, min(100.0, safety_score))

    def compute_rank_score(
        self,
        safety_score: float,
        duration_s: float,
        min_duration_s: float,
        alpha: float = 0.5,
    ) -> float:
        """
        Compute combined rank score (eq 6).
        alpha=1 means pure safety, alpha=0 means pure speed.
        """
        if min_duration_s <= 0:
            min_duration_s = 1.0

        time_score = 100 * (min_duration_s / max(duration_s, 1))
        rank = alpha * safety_score + (1 - alpha) * time_score

        return max(0.0, min(100.0, rank))

    def rank_routes(
        self,
        routes_data: list[dict],
        alpha: float = 0.5,
        avoid_classes: list[str] | None = None,
    ) -> list[RouteAlternative]:
        """
        Rank multiple routes by combined safety + time score.

        routes_data: list of dicts with keys:
            - route_index, segments, distance_m, duration_s, distance_str, duration_str, polyline
        """
        scored = []

        for rd in routes_data:
            segments = rd.get("segments", [])
            safety_score = self.compute_route_safety_score(segments, avoid_classes)

            hazard_count = sum(len(s.hazards) for s in segments)
            hazard_summary = self._hazard_summary(segments)

            scored.append({
                "route_index": rd["route_index"],
                "safety_score": safety_score,
                "duration_s": rd["duration_s"],
                "distance_m": rd["distance_m"],
                "distance_str": rd["distance_str"],
                "duration_str": rd["duration_str"],
                "polyline": rd.get("polyline", ""),
                "hazard_count": hazard_count,
                "hazard_summary": hazard_summary,
            })

        if not scored:
            return []

        min_duration = min(s["duration_s"] for s in scored) or 1.0

        alternatives = []
        for s in scored:
            rank_score = self.compute_rank_score(
                s["safety_score"], s["duration_s"], min_duration, alpha
            )
            alternatives.append(RouteAlternative(
                route_index=s["route_index"],
                score=round(rank_score, 1),
                safety_score=round(s["safety_score"], 1),
                rank_score=round(rank_score, 1),
                distance=s["distance_str"],
                duration=s["duration_str"],
                distance_m=s["distance_m"],
                duration_s=s["duration_s"],
                hazards=s["hazard_count"],
                polyline=s["polyline"],
                hazard_summary=s["hazard_summary"],
            ))

        alternatives.sort(key=lambda x: x.rank_score, reverse=True)
        return alternatives

    def _hazard_summary(self, segments: list[RouteSegment]) -> dict:
        summary = {}
        for seg in segments:
            for det in seg.hazards:
                name = det.class_name
                if name not in summary:
                    summary[name] = {"count": 0, "avg_confidence": 0.0, "severities": []}
                summary[name]["count"] += 1
                summary[name]["avg_confidence"] += det.confidence
                summary[name]["severities"].append(det.severity)

        for name in summary:
            count = summary[name]["count"]
            if count > 0:
                summary[name]["avg_confidence"] = round(summary[name]["avg_confidence"] / count, 3)
            summary[name]["severities"] = list(set(summary[name]["severities"]))

        return summary


safety_scorer = SafetyScorer()
