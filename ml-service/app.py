
import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

app = FastAPI(title="UIP AI Model Service")

MODEL_PATH = Path(__file__).parent / "models" / "best.pt"
CONFIDENCE_THRESHOLD = 0.60

if not MODEL_PATH.exists():
    raise RuntimeError(f"Model weights not found: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "task": model.task,
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
        import io

        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, SyntaxError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model.predict(source=image, verbose=False)
        result = results[0]

        # This trained model is a classification model.
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
            "needs_review": confidence < CONFIDENCE_THRESHOLD,
            "model_task": model.task,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed.",
        )
