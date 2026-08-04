"""
SafeRoute AI - Inference Script
Run hazard detection on road images using trained YOLOv8 model.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def predict_image(image_path: str, model_path: str = None, conf: float = 0.4):
    """Run prediction on a single image."""
    from ultralytics import YOLO

    if model_path is None:
        model_path = str(PROJECT_ROOT / "data" / "models" / "best.pt")

    if not Path(model_path).exists():
        print(f"Model not found at {model_path}")
        print("Train a model first: python train.py train")
        return

    model = YOLO(model_path)
    results = model.predict(source=image_path, conf=conf, save=True, verbose=True)

    CLASS_NAMES = {
        0: "pothole",
        1: "crack",
        2: "damaged",
        3: "waterlogged",
        4: "uneven",
    }

    for r in results:
        print(f"\nImage: {image_path}")
        print(f"Detections: {len(r.boxes)}")

        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            name = CLASS_NAMES.get(cls_id, f"class_{cls_id}")
            print(f"  {name}: {conf:.2%} at ({x1:.0f},{y1:.0f})-({x2:.0f},{y2:.0f})")

    return results


def predict_video(video_path: str, model_path: str = None, conf: float = 0.4):
    """Run prediction on a video."""
    from ultralytics import YOLO

    if model_path is None:
        model_path = str(PROJECT_ROOT / "data" / "models" / "best.pt")

    model = YOLO(model_path)
    results = model.predict(source=video_path, conf=conf, save=True, stream=True, verbose=True)

    for r in results:
        print(f"Frame detections: {len(r.boxes)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("SafeRoute AI - Inference")
        print("Usage:")
        print("  python predict.py <image_path> [model_path] [confidence]")
        print("  python predict.py video <video_path> [model_path]")
        sys.exit(0)

    if sys.argv[1] == "video":
        video_path = sys.argv[2] if len(sys.argv) > 2 else "test.mp4"
        model_path = sys.argv[3] if len(sys.argv) > 3 else None
        predict_video(video_path, model_path)
    else:
        image_path = sys.argv[1]
        model_path = sys.argv[2] if len(sys.argv) > 2 else None
        conf = float(sys.argv[3]) if len(sys.argv) > 3 else 0.4
        predict_image(image_path, model_path, conf)
