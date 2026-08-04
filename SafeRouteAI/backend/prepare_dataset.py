"""
SafeRoute AI - Dataset Download & Preparation Script

Downloads free road hazard datasets and prepares them for YOLOv8 training.
Supports: RDD2022, RDD2020, Road Damage Dataset, RDDC2024-ID.
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PREPARED_DIR = DATA_DIR / "prepared"

RAW_DIR.mkdir(parents=True, exist_ok=True)
PREPARED_DIR.mkdir(parents=True, exist_ok=True)


def download_rdd2022_kaggle():
    """Download RDD2022 via kaggle CLI."""
    print("Downloading RDD2022 from Kaggle...")
    os.system("kaggle datasets download -d aliabdelmenam/rdd-2022 -p data/raw/")

    zip_path = DATA_DIR / "raw" / "rdd-2022.zip"
    if zip_path.exists():
        print("Extracting...")
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(RAW_DIR / "rdd2022")
        print("RDD2022 extracted to data/raw/rdd2022/")
    else:
        print("Download failed. Check kaggle CLI setup.")
        print("  pip install kaggle")
        print("  kaggle datasets download -d aliabdelmenam/rdd-2022")


def download_via_wget(url: str, output_path: Path):
    """Download file via wget or curl."""
    try:
        os.system(f'wget -O "{output_path}" "{url}"')
        return output_path.exists()
    except Exception:
        try:
            os.system(f'curl -L -o "{output_path}" "{url}"')
            return output_path.exists()
        except Exception:
            return False


def prepare_rddc2024():
    """Prepare RDDC2024-ID dataset (already in YOLO format)."""
    source = RAW_DIR / "rddc2024"
    if not source.exists():
        print("RDDC2024 not found. Download from:")
        print("  https://drive.google.com/file/d/1AbNe-dhK2ikaK05ATsPUcJXWW_bsz-pp")
        return

    print("Preparing RDDC2024-ID dataset...")

    # Class mapping: RDDC2024 -> SafeRoute AI
    class_map = {
        0: 1,  # Longitudinal Crack -> crack
        1: 1,  # Lateral Crack -> crack
        2: 2,  # Alligator Crack -> damaged
        3: 0,  # Pothole -> pothole
        4: 2,  # Other -> damaged
    }

    for split in ["train", "val", "test"]:
        split_dir = source / split
        if not split_dir.exists():
            continue

        images_out = PREPARED_DIR / split / "images"
        labels_out = PREPARED_DIR / split / "labels"
        images_out.mkdir(parents=True, exist_ok=True)
        labels_out.mkdir(parents=True, exist_ok=True)

        img_dir = split_dir / "images"
        lbl_dir = split_dir / "labels"

        if img_dir.exists():
            for img_file in img_dir.glob("*"):
                if img_file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    shutil.copy2(img_file, images_out / img_file.name)

        if lbl_dir.exists():
            for lbl_file in lbl_dir.glob("*.txt"):
                new_lines = []
                with open(lbl_file) as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) >= 5:
                            old_cls = int(parts[0])
                            new_cls = class_map.get(old_cls, old_cls)
                            new_lines.append(f"{new_cls} {' '.join(parts[1:])}")

                if new_lines:
                    out_file = labels_out / lbl_file.name
                    with open(out_file, "w") as f:
                        f.write("\n".join(new_lines))

    print("  RDDC2024 prepared.")


def prepare_road_damage_kaggle():
    """Prepare the Kaggle Road Damage Dataset (already YOLO format)."""
    source = RAW_DIR / "road_damage"
    if not source.exists():
        print("Road Damage Dataset not found. Download from:")
        print("  https://www.kaggle.com/datasets/lorenzoarcioni/road-damage-dataset-potholes-cracks-and-manholes")
        return

    print("Preparing Road Damage Dataset...")

    # Class mapping: Pothole=0, Crack=1, Manhole -> damaged
    class_map = {
        0: 0,  # Pothole -> pothole
        1: 1,  # Crack -> crack
        2: 2,  # Manhole -> damaged
    }

    for split_name in ["train", "valid", "test"]:
        split_dir = source / split_name
        if not split_dir.exists():
            continue

        target_split = "val" if split_name == "valid" else split_name
        images_out = PREPARED_DIR / target_split / "images"
        labels_out = PREPARED_DIR / target_split / "labels"
        images_out.mkdir(parents=True, exist_ok=True)
        labels_out.mkdir(parents=True, exist_ok=True)

        img_dir = split_dir / "images"
        lbl_dir = split_dir / "labels"

        if img_dir.exists():
            for img_file in img_dir.glob("*"):
                if img_file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    shutil.copy2(img_file, images_out / img_file.name)

        if lbl_dir.exists():
            for lbl_file in lbl_dir.glob("*.txt"):
                new_lines = []
                with open(lbl_file) as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) >= 5:
                            old_cls = int(parts[0])
                            new_cls = class_map.get(old_cls, old_cls)
                            new_lines.append(f"{new_cls} {' '.join(parts[1:])}")

                if new_lines:
                    out_file = labels_out / lbl_file.name
                    with open(out_file, "w") as f:
                        f.write("\n".join(new_lines))

    print("  Road Damage Dataset prepared.")


def create_yaml():
    """Create dataset.yaml for YOLO training."""
    import yaml

    yaml_content = {
        "path": str(PREPARED_DIR.resolve()),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": 5,
        "names": ["pothole", "crack", "damaged", "waterlogged", "uneven"],
    }

    yaml_path = PREPARED_DIR / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(yaml_content, f, default_flow_style=False)

    print(f"  Dataset YAML: {yaml_path}")
    return yaml_path


def show_status():
    """Show current dataset status."""
    print("=" * 60)
    print("DATASET STATUS")
    print("=" * 60)

    for name in ["rdd2022", "rdd2020", "road_damage", "rddc2024"]:
        d = RAW_DIR / name
        exists = "FOUND" if d.exists() else "NOT FOUND"
        print(f"  {name:15s} : {exists}")

    print()
    for split in ["train", "val", "test"]:
        img_dir = PREPARED_DIR / split / "images"
        lbl_dir = PREPARED_DIR / split / "labels"
        n_img = len(list(img_dir.glob("*"))) if img_dir.exists() else 0
        n_lbl = len(list(lbl_dir.glob("*"))) if lbl_dir.exists() else 0
        print(f"  {split:10s} : {n_img} images, {n_lbl} labels")

    yaml_path = PREPARED_DIR / "dataset.yaml"
    print(f"\n  YAML exists  : {'YES' if yaml_path.exists() else 'NO'}")
    model_path = DATA_DIR / "models" / "best.pt"
    print(f"  Model exists : {'YES' if model_path.exists() else 'NO'}")
    print("=" * 60)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("SafeRoute AI - Dataset Manager")
        print("Usage:")
        print("  python prepare_dataset.py status     - Show dataset status")
        print("  python prepare_dataset.py download   - Download instructions")
        print("  python prepare_dataset.py prepare    - Prepare downloaded datasets")
        print("  python prepare_dataset.py yaml       - Create dataset.yaml")
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "status":
        show_status()
    elif cmd == "download":
        print("DOWNLOAD OPTIONS:")
        print()
        print("1. RDD2022 (Kaggle - recommended):")
        print("   pip install kaggle")
        print("   kaggle datasets download -d aliabdelmenam/rdd-2022")
        print(f"   Extract to: {RAW_DIR}/rdd2022/")
        print()
        print("2. Road Damage Dataset (Kaggle):")
        print("   https://www.kaggle.com/datasets/lorenzoarcioni/road-damage-dataset-potholes-cracks-and-manholes")
        print(f"   Extract to: {RAW_DIR}/road_damage/")
        print()
        print("3. RDDC2024-ID (Google Drive):")
        print("   https://drive.google.com/file/d/1AbNe-dhK2ikaK05ATsPUcJXWW_bsz-pp")
        print(f"   Extract to: {RAW_DIR}/rddc2024/")
        print()
        print("4. RDD2020 (Mendeley):")
        print("   https://data.mendeley.com/datasets/5ty2wb6gvg/1")
        print(f"   Extract to: {RAW_DIR}/rdd2020/")
    elif cmd == "prepare":
        prepare_rddc2024()
        prepare_road_damage_kaggle()
        create_yaml()
        show_status()
    elif cmd == "yaml":
        create_yaml()
    else:
        print(f"Unknown command: {cmd}")
