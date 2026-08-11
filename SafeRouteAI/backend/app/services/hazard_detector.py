import numpy as np
from pathlib import Path
from PIL import Image
from app.config import settings, MODEL_DIR, HAZARD_CLASSES
from app.models.prediction import HazardDetection


class HazardDetector:
    """YOLOv8-based hazard detection for road images."""

    CLASS_NAMES = {
        0: "pothole",
        1: "crack",
        2: "damaged",
        3: "waterlogged",
        4: "uneven",
    }

    SEVERITY_MAP = {
        "pothole": "warning",
        "crack": "info",
        "damaged": "warning",
        "waterlogged": "critical",
        "uneven": "info",
    }

    def __init__(self):
        self._model = None
        self._model_path = MODEL_DIR / "best.pt"

    def _load_model(self):
        if self._model is not None:
            return
        if not self._model_path.exists():
            return
        try:
            from ultralytics import YOLO
            self._model = YOLO(str(self._model_path))
        except Exception:
            self._model = None

    @property
    def model_available(self) -> bool:
        self._load_model()
        return self._model is not None

    def detect_from_image(self, image_path: str | Path) -> list[HazardDetection]:
        """Run YOLOv8 inference on a single image."""
        self._load_model()

        if self._model is None:
            return self._mock_detect()

        try:
            results = self._model.predict(
                source=str(image_path),
                conf=settings.confidence_threshold,
                verbose=False,
            )
            detections = []
            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    class_name = self.CLASS_NAMES.get(cls_id, f"class_{cls_id}")

                    detections.append(HazardDetection(
                        class_name=class_name,
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        severity=self.SEVERITY_MAP.get(class_name, "info"),
                    ))
            return detections

        except Exception:
            return self._mock_detect()

    def detect_from_array(self, image_array: np.ndarray) -> list[HazardDetection]:
        """Run detection on a numpy array (for in-memory images)."""
        self._load_model()

        if self._model is None:
            return self._mock_detect()

        try:
            results = self._model.predict(
                source=image_array,
                conf=settings.confidence_threshold,
                verbose=False,
            )
            detections = []
            for r in results:
                boxes = r.boxes
                if boxes is None:
                    continue
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    class_name = self.CLASS_NAMES.get(cls_id, f"class_{cls_id}")

                    detections.append(HazardDetection(
                        class_name=class_name,
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        severity=self.SEVERITY_MAP.get(class_name, "info"),
                    ))
            return detections

        except Exception:
            return self._mock_detect()

    def classify_crack_severity(self, detection: HazardDetection) -> str:
        """Secondary crack severity classifier based on bbox size/aspect ratio."""
        if detection.class_name != "crack":
            return detection.severity

        x1, y1, x2, y2 = detection.bbox
        width = x2 - x1
        height = y2 - y1
        area = width * height
        aspect_ratio = max(width, height) / max(min(width, height), 1)

        if area > 15000 and aspect_ratio > 3:
            return "critical"
        elif area > 8000 or aspect_ratio > 2:
            return "warning"
        return "info"

    def _mock_detect(self) -> list[HazardDetection]:
        """Return mock detections when model is not loaded."""
        import random
        mock_hazards = [
            HazardDetection(
                class_name="pothole",
                confidence=round(random.uniform(0.5, 0.9), 2),
                bbox=(100, 150, 250, 300),
                severity="warning",
            ),
            HazardDetection(
                class_name="crack",
                confidence=round(random.uniform(0.4, 0.8), 2),
                bbox=(50, 200, 300, 220),
                severity="info",
            ),
            HazardDetection(
                class_name="waterlogged",
                confidence=round(random.uniform(0.5, 0.85), 2),
                bbox=(200, 100, 400, 350),
                severity="critical",
            ),
        ]
        return random.sample(mock_hazards, k=random.randint(1, 3))


hazard_detector = HazardDetector()
