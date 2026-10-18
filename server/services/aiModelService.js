
const AI_MODEL_URL =
  process.env.AI_MODEL_URL || "http://127.0.0.1:8000";

export async function predictIssueImage(photo) {
  const image =
    typeof photo === "string"
      ? photo
      : photo?.dataUrl || photo?.dataURL || photo?.url || photo?.preview;

  if (typeof image !== "string") {
    throw new Error("No image data was provided to the AI model.");
  }

  const match = image.match(
    /^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i
  );

  if (!match) {
    throw new Error(
      "AI prediction requires an image in base64 data URL format."
    );
  }

  const mimeType =
    match[1].toLowerCase() === "jpg"
      ? "image/jpeg"
      : `image/${match[1].toLowerCase()}`;

  const imageBuffer = Buffer.from(match[2], "base64");

  if (!imageBuffer.length) {
    throw new Error("The uploaded image is empty.");
  }

  const formData = new FormData();

  formData.append(
    "file",
    new Blob([imageBuffer], { type: mimeType }),
    `report-image.${match[1].toLowerCase()}`
  );

  const response = await fetch(`${AI_MODEL_URL}/predict`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `AI model request failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  if (
    typeof result.predicted_class !== "string" ||
    typeof result.confidence !== "number"
  ) {
    throw new Error("The AI model returned an invalid prediction.");
  }

  return {
    predictedClass: result.predicted_class,
    confidence: result.confidence,
    confidencePercent: result.confidence_percent,
    needsReview: result.needs_review,
  };
}

