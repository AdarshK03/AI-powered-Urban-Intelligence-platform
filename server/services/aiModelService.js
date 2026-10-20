
const AI_MODEL_URL =
  process.env.AI_MODEL_URL || "http://127.0.0.1:8000";

export function mapAiClassToCategory(predictedClass) {
  if (!predictedClass || typeof predictedClass !== "string") {
    return { category: "under_review", label: "Under Review" };
  }
  const raw = predictedClass.toLowerCase().trim();

  // Explicit mapping for new multi-label classes
  if (raw === "construction_zone" || raw.includes("construction")) {
    return { category: "road", label: "Construction Zone" };
  }
  if (raw === "damaged_road" || raw.includes("damaged_road")) {
    return { category: "road", label: "Broken Road" };
  }
  if (raw === "waterlogged_road" || raw.includes("waterlogged")) {
    return { category: "water", label: "Water Logging" };
  }
  if (raw === "garbage" || raw.includes("garbage") || raw.includes("dump")) {
    return { category: "other", label: "Garbage & Waste" };
  }
  if (raw === "manhole" || raw.includes("manhole")) {
    return { category: "drain", label: "Open Drain / Manhole" };
  }
  if (raw === "pothole" || raw.includes("pothole")) {
    return { category: "pothole", label: "Pothole" };
  }

  // Fallback keyword rules
  if (raw.includes("crack") || raw.includes("road")) {
    if (raw.includes("water")) {
      return { category: "water", label: "Water Logging" };
    }
    return { category: "road", label: "Broken Road" };
  }
  if (raw.includes("drain")) {
    return { category: "drain", label: "Open Drain" };
  }
  if (raw.includes("water")) {
    return { category: "water", label: "Water Logging" };
  }
  if (raw.includes("light")) {
    return { category: "light", label: "Street Light" };
  }

  return { category: "under_review", label: "Under Review" };
}

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

  const mapping = mapAiClassToCategory(result.predicted_class);

  return {
    predictedClass: result.predicted_class,
    mappedCategory: mapping.category,
    categoryLabel: mapping.label,
    confidence: result.confidence,
    confidencePercent: result.confidence_percent,
    needsReview: !!result.needs_review,
  };
}

