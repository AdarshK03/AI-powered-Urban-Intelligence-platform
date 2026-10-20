import io
import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms

app = FastAPI(title="UIP AI Model Service")

MODELS_DIR = Path(__file__).parent / "models"

# Detect model file
MODEL_PATH = None
for candidate in [
    MODELS_DIR / "uip_cnn_multilabel_best.pt",
    MODELS_DIR / "best.pt",
]:
    if candidate.exists():
        MODEL_PATH = candidate
        break

if not MODEL_PATH or not MODEL_PATH.exists():
    raise RuntimeError(f"No model weights found in {MODELS_DIR}")

# Load model: Check whether it is a PyTorch CNN checkpoint or Ultralytics YOLO
is_torchvision_cnn = False
cnn_model = None
yolo_model = None
class_names = []
image_size = 224
threshold = 0.50
task_name = "classification"

try:
    checkpoint = torch.load(str(MODEL_PATH), map_location="cpu")
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        arch = checkpoint.get("architecture", "resnet18")
        class_names = checkpoint.get(
            "class_names",
            [
                "construction_zone",
                "damaged_road",
                "garbage",
                "manhole",
                "pothole",
                "waterlogged_road",
            ],
        )
        image_size = checkpoint.get("image_size", 224)
        threshold = checkpoint.get("threshold", 0.50)
        task_name = checkpoint.get("task", "multilabel_classification")

        if arch == "resnet18":
            cnn_model = models.resnet18(weights=None)
            num_ftrs = cnn_model.fc.in_features
            cnn_model.fc = nn.Linear(num_ftrs, len(class_names))
            cnn_model.load_state_dict(checkpoint["model_state_dict"])
            cnn_model.eval()
            is_torchvision_cnn = True
            print(f"Loaded {arch} ({task_name}) model from {MODEL_PATH.name} with {len(class_names)} classes.")
        else:
            raise ValueError(f"Unsupported architecture: {arch}")
    else:
        raise ValueError("Not a dictionary checkpoint")
except Exception as e:
    # If not a custom torch dict, attempt Ultralytics YOLO
    try:
        from ultralytics import YOLO
        yolo_model = YOLO(str(MODEL_PATH))
        is_torchvision_cnn = False
        task_name = yolo_model.task
        threshold = 0.60
        class_names = (
            list(yolo_model.names.values())
            if isinstance(yolo_model.names, dict)
            else list(yolo_model.names)
        )
        print(f"Loaded Ultralytics YOLO model from {MODEL_PATH.name}.")
    except Exception as yolo_err:
        raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e} / {yolo_err}")

# Setup torchvision transforms for CNN
cnn_transforms = transforms.Compose([
    transforms.Resize((image_size, image_size)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "model_file": MODEL_PATH.name,
        "architecture": "resnet18" if is_torchvision_cnn else "yolo",
        "task": task_name,
        "classes": class_names,
        "threshold": threshold,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG, PNG, or WebP image.",
        )

    image_bytes = await file.read()

    if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be non-empty and no larger than 10 MB.",
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, SyntaxError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        if is_torchvision_cnn:
            tensor = cnn_transforms(image).unsqueeze(0)
            with torch.no_grad():
                logits = cnn_model(tensor)
                probs = torch.sigmoid(logits)[0]

            top_prob, top_idx = torch.max(probs, dim=0)
            confidence = float(top_prob.item())
            predicted_class = class_names[top_idx.item()]
            active_classes = [
                class_names[i] for i, p in enumerate(probs) if p.item() >= threshold
            ]

            return {
                "predicted_class": predicted_class,
                "confidence": round(confidence, 4),
                "confidence_percent": round(confidence * 100, 2),
                "needs_review": confidence < threshold,
                "active_classes": active_classes,
                "all_probabilities": {
                    name: round(float(p.item()), 4)
                    for name, p in zip(class_names, probs)
                },
                "model_task": task_name,
            }
        else:
            results = yolo_model.predict(source=image, verbose=False)
            result = results[0]

            if result.probs is None:
                raise HTTPException(
                    status_code=500,
                    detail="The loaded model is not an image-classification model.",
                )

            class_id = int(result.probs.top1)
            confidence = float(result.probs.top1conf)
            predicted_class = result.names[class_id]

            return {
                "predicted_class": predicted_class,
                "confidence": round(confidence, 4),
                "confidence_percent": round(confidence * 100, 2),
                "needs_review": confidence < threshold,
                "model_task": task_name,
            }

    except HTTPException:
        raise
    except Exception as err:
        print("Prediction error:", err)
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed.",
        )
