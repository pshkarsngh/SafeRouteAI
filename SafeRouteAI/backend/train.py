"""
SafeRoute AI - YOLOv8 Hazard Detection Training Script

Free Datasets Available:
1. RDD2022 (Kaggle) - 38K+ images, 5 classes (D00, D10, D20, D40, D60)
   Download: kaggle datasets download -d aliabdelmenam/rdd-2022
   Classes: Longitudinal Crack, Transverse Crack, Alligator Crack, Other Corruption, Pothole

2. RDD2020 (Mendeley) - 26K images, 4 classes
   Download: https://data.mendeley.com/datasets/5ty2wb6gvg/1
   Classes: Longitudinal Crack (D00), Transverse Crack (D10), Alligator Crack (D20), Pothole (D40)

3. Road Damage Dataset (Kaggle) - 2000+ images, 3 classes, YOLO format
   Download: https://www.kaggle.com/datasets/lorenzoarcioni/road-damage-dataset-potholes-cracks-and-manholes
   Classes: Pothole, Crack, Manhole

4. RDDC2024-ID (GitHub) - 9000+ images, 5 classes, YOLO format
   Download: https://drive.google.com/file/d/1AbNe-dhK2ikaK05ATsPUcJXWW_bsz-pp
   Classes: Longitudinal Crack, Lateral Crack, Alligator Crack, Pothole, Other

Mapping to SafeRoute AI classes:
  D00 (Longitudinal) -> crack
  D10 (Transverse)   -> crack
  D20 (Alligator)    -> damaged
  D40 (Pothole)      -> pothole
  D60/Other          -> damaged
  Waterlogged        -> waterlogged (need separate data or augmentation)
  Uneven             -> uneven (need separate data or augmentation)
"""

import os
import shutil
import yaml
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PREPARED_DIR = DATA_DIR / "prepared"
MODEL_DIR = DATA_DIR / "models"

# Target class mapping (paper's 5 classes)
TARGET_CLASSES = {
    "pothole": 0,
    "crack": 1,
    "damaged": 2,
    "waterlogged": 3,
    "uneven": 4,
}

# RDD2022 class mapping (source -> target)
RDD2022_MAP = {
    "D00": "crack",       # Longitudinal Crack
    "D10": "crack",       # Transverse Crack
    "D20": "damaged",     # Alligator Crack
    "D40": "pothole",     # Pothole
    "D60": "damaged",     # Other Corruption
}

SPLIT_RATIOS = {"train": 0.7, "val": 0.15, "test": 0.15}


# ============================================================
# STEP 1: Download datasets (manual or via kaggle CLI)
# ============================================================

def print_download_instructions():
    print("=" * 60)
    print("FREE DATASET DOWNLOAD INSTRUCTIONS")
    print("=" * 60)
    print()
    print("Option 1: RDD2022 (Recommended - most comprehensive)")
    print("  pip install kaggle")
    print("  kaggle datasets download -d aliabdelmenam/rdd-2022")
    print("  unzip rdd-2022.zip -d data/raw/rdd2022/")
    print()
    print("Option 2: Road Damage Dataset (smaller, easier)")
    print("  https://www.kaggle.com/datasets/lorenzoarcioni/road-damage-dataset-potholes-cracks-and-manholes")
    print("  Download and extract to data/raw/road_damage/")
    print()
    print("Option 3: RDDC2024-ID (Indonesian roads, YOLO format)")
    print("  https://drive.google.com/file/d/1AbNe-dhK2ikaK05ATsPUcJXWW_bsz-pp")
    print("  Download and extract to data/raw/rddc2024/")
    print()
    print("Option 4: RDD2020 (Mendeley, Pascal VOC format)")
    print("  https://data.mendeley.com/datasets/5ty2wb6gvg/1")
    print("  Download and extract to data/raw/rdd2020/")
    print("=" * 60)


# ============================================================
# STEP 2: Convert RDD2022 (Pascal VOC) to YOLO format
# ============================================================

def convert_voc_to_yolo(xml_path: str, img_width: int, img_height: int) -> list:
    """Convert Pascal VOC XML annotation to YOLO format."""
    import xml.etree.ElementTree as ET

    tree = ET.parse(xml_path)
    root = tree.getroot()
    yolo_lines = []

    for obj in root.findall("object"):
        name = obj.find("name").text
        if name not in RDD2022_MAP:
            continue

        target_class = RDD2022_MAP[name]
        class_id = TARGET_CLASSES[target_class]

        bbox = obj.find("bndbox")
        xmin = float(bbox.find("xmin").text)
        ymin = float(bbox.find("ymin").text)
        xmax = float(bbox.find("xmax").text)
        ymax = float(bbox.find("ymax").text)

        x_center = ((xmin + xmax) / 2) / img_width
        y_center = ((ymin + ymax) / 2) / img_height
        width = (xmax - xmin) / img_width
        height = (ymax - ymin) / img_height

        x_center = max(0, min(1, x_center))
        y_center = max(0, min(1, y_center))
        width = max(0, min(1, width))
        height = max(0, min(1, height))

        yolo_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")

    return yolo_lines


def process_rdd2022(source_dir: Path, output_dir: Path):
    """Process RDD2022 dataset from Pascal VOC to YOLO format."""
    print("Processing RDD2022 dataset...")

    for split in ["train", "val", "test"]:
        split_dir = source_dir / split
        if not split_dir.exists():
            continue

        images_out = output_dir / split / "images"
        labels_out = output_dir / split / "labels"
        images_out.mkdir(parents=True, exist_ok=True)
        labels_out.mkdir(parents=True, exist_ok=True)

        for country_dir in split_dir.iterdir():
            if not country_dir.is_dir():
                continue

            img_dir = country_dir / "images"
            ann_dir = country_dir / "annotations"

            if not img_dir.exists():
                continue

            for img_file in img_dir.glob("*.jpg"):
                shutil.copy2(img_file, images_out / img_file.name)

                xml_file = ann_dir / (img_file.stem + ".xml")
                if xml_file.exists():
                    from PIL import Image
                    img = Image.open(img_file)
                    w, h = img.size
                    yolo_lines = convert_voc_to_yolo(str(xml_file), w, h)
                    label_file = labels_out / (img_file.stem + ".txt")
                    label_file.write_text("\n".join(yolo_lines))

    print(f"  RDD2022 processed to {output_dir}")


# ============================================================
# STEP 3: Prepare YOLO dataset structure
# ============================================================

def create_dataset_yaml(output_dir: Path):
    """Create YOLO dataset YAML config."""
    yaml_content = {
        "path": str(output_dir.resolve()),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": len(TARGET_CLASSES),
        "names": list(TARGET_CLASSES.keys()),
    }

    yaml_path = output_dir / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(yaml_content, f, default_flow_style=False)

    print(f"  Dataset YAML created: {yaml_path}")
    return yaml_path


# ============================================================
# STEP 4: Train YOLOv8 model
# ============================================================

def train_model(yaml_path: str, epochs: int = 100, imgsz: int = 640, batch: int = 16):
    """Train YOLOv8 model on prepared dataset."""
    from ultralytics import YOLO

    print("=" * 60)
    print("TRAINING YOLOv8 HAZARD DETECTION MODEL")
    print("=" * 60)

    model = YOLO("yolov8n.pt")

    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name="saferoute_hazard",
        project=str(MODEL_DIR),
        patience=20,
        save=True,
        plots=True,
        device="0" if _cuda_available() else "cpu",
    )

    best_model_path = MODEL_DIR / "saferoute_hazard" / "weights" / "best.pt"
    if best_model_path.exists():
        shutil.copy2(best_model_path, MODEL_DIR / "best.pt")
        print(f"  Best model saved to {MODEL_DIR / 'best.pt'}")

    return results


def _cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "download":
        print_download_instructions()
    elif len(sys.argv) > 1 and sys.argv[1] == "prepare":
        rdd2022_dir = RAW_DIR / "rdd2022"
        if rdd2022_dir.exists():
            process_rdd2022(rdd2022_dir, PREPARED_DIR)
            yaml_path = create_dataset_yaml(PREPARED_DIR)
            print(f"\nNext step: python train.py train")
        else:
            print(f"RDD2022 not found at {rdd2022_dir}")
            print("Run: python train.py download")
    elif len(sys.argv) > 1 and sys.argv[1] == "train":
        yaml_path = PREPARED_DIR / "dataset.yaml"
        if yaml_path.exists():
            epochs = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            train_model(str(yaml_path), epochs=epochs)
        else:
            print(f"Dataset YAML not found at {yaml_path}")
            print("Run: python train.py prepare")
    else:
        print("SafeRoute AI - Model Training")
        print("Usage:")
        print("  python train.py download   - Show dataset download instructions")
        print("  python train.py prepare    - Convert and prepare dataset")
        print("  python train.py train [N]  - Train model (N epochs, default 100)")
