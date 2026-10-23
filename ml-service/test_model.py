"""
Automated Verification Suite for Urban Intelligence Platform (UIP) ML Model.
Validates model weights, architecture loading, input transformations,
and multi-label inference behavior.
"""

import sys
import time
from pathlib import Path
from PIL import Image
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms

ML_DIR = Path(__file__).parent
MODELS_DIR = ML_DIR / "models"
MODEL_PATH = MODELS_DIR / "uip_cnn_multilabel_best.pt"
METADATA_PATH = MODELS_DIR / "uip_cnn_multilabel_metadata.json"

EXPECTED_CLASSES = [
    "construction_zone",
    "damaged_road",
    "garbage",
    "manhole",
    "pothole",
    "waterlogged_road",
]

def run_checks():
    print("=" * 60)
    print("UIP Machine Learning Model Verification Suite")
    print("=" * 60)

    # 1. Weight File Verification
    print("\n[Step 1/5] Checking model files...")
    assert MODEL_PATH.exists(), f"Missing model weights at {MODEL_PATH}"
    size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
    print(f"  [OK] Found weights: {MODEL_PATH.name} ({size_mb:.2f} MB)")

    if METADATA_PATH.exists():
        import json
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        print(f"  [OK] Metadata found (Validation Macro F1: {meta.get('best_validation_macro_f1', 0):.4f})")
    else:
        print("  ! Metadata file not present (optional)")

    # 2. Checkpoint Structure and Architecture Check
    print("\n[Step 2/5] Loading PyTorch checkpoint...")
    checkpoint = torch.load(str(MODEL_PATH), map_location="cpu")
    assert isinstance(checkpoint, dict), "Checkpoint is not a valid dictionary"
    assert "model_state_dict" in checkpoint, "Missing 'model_state_dict' in checkpoint"

    arch = checkpoint.get("architecture", "resnet18")
    class_names = checkpoint.get("class_names", EXPECTED_CLASSES)
    image_size = checkpoint.get("image_size", 224)
    threshold = checkpoint.get("threshold", 0.50)

    print(f"  [OK] Architecture: {arch}")
    print(f"  [OK] Target Classes ({len(class_names)}): {class_names}")
    print(f"  [OK] Input Resolution: {image_size}x{image_size}")
    print(f"  [OK] Classification Threshold: {threshold}")

    # 3. Model Instantiation & Weights Load
    print("\n[Step 3/5] Instantiating ResNet-18 model & loading state dict...")
    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, len(class_names))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    print("  [OK] State dictionary successfully applied into PyTorch network.")

    # 4. Dummy Synthetic Input Inference
    print("\n[Step 4/5] Testing forward pass with synthetic tensor...")
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    dummy_img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    tensor = transform(dummy_img).unsqueeze(0)

    start_time = time.perf_counter()
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.sigmoid(logits)[0]
    elapsed = (time.perf_counter() - start_time) * 1000

    assert logits.shape == (1, len(class_names)), f"Unexpected logits shape: {logits.shape}"
    assert probs.min() >= 0.0 and probs.max() <= 1.0, "Sigmoid probabilities out of bounds"
    print(f"  [OK] Synthetic inference forward pass succeeded in {elapsed:.2f} ms")

    # 5. Real Image Inference (if uploads exist)
    print("\n[Step 5/5] Testing inference on real sample images...")
    uploads_dir = ML_DIR.parent / "server" / "uploads"
    sample_images = list(uploads_dir.glob("iss_*.jpg")) if uploads_dir.exists() else []

    if sample_images:
        test_img_path = sample_images[0]
        with Image.open(test_img_path) as img:
            rgb_img = img.convert("RGB")
            t = transform(rgb_img).unsqueeze(0)
            with torch.no_grad():
                l = model(t)
                p = torch.sigmoid(l)[0]

        top_prob, top_idx = torch.max(p, dim=0)
        pred_class = class_names[top_idx.item()]
        conf = float(top_prob.item())

        print(f"  [OK] Tested on: {test_img_path.name}")
        print(f"  [OK] Predicted Defect: {pred_class} (Confidence: {conf*100:.2f}%)")
        print("  [OK] Class probabilities distribution:")
        for name, prob in zip(class_names, p):
            bar = "#" * int(prob.item() * 20)
            print(f"      - {name:<18}: {prob.item():.4f}  {bar}")
    else:
        print("  ! No sample uploads found to test real image; synthetic test passed.")

    print("\n" + "=" * 60)
    print("SUCCESS: UIP ML Model is fully functional and operational!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_checks()
    except Exception as e:
        print(f"\n[FAIL] Verification error: {e}", file=sys.stderr)
        sys.exit(1)
