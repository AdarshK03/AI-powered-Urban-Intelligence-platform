
import crypto from "node:crypto";
import sharp from "sharp";

export async function createImageHashes(image) {
  if (typeof image !== "string" || !image.trim()) {
    throw new Error("Invalid image input");
  }

  // Process Base64 images uploaded by the report form.
  const match = image.match(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/
  );

  if (!match) {
    return null;
  }

  const imageBuffer = Buffer.from(match[1], "base64");

  if (!imageBuffer.length) {
    throw new Error("Empty image");
  }

  // Exact hash: detects identical file bytes.
  const exactHash = crypto
    .createHash("sha256")
    .update(imageBuffer)
    .digest("hex");

  // Normalize image format and dimensions for a second comparison.
  let normalizedHash = null;
  try {
    const normalizedBuffer = await sharp(imageBuffer, {
      limitInputPixels: 40000000,
    })
      .rotate()
      .resize(256, 256, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .removeAlpha()
      .raw()
      .toBuffer();

    normalizedHash = crypto
      .createHash("sha256")
      .update(normalizedBuffer)
      .digest("hex");
  } catch (err) {
    console.warn("Sharp image normalization skipped:", err.message);
  }

  return {
    exactHash,
    normalizedHash,
  };
}
