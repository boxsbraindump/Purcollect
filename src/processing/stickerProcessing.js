import { removeBackground } from "@imgly/background-removal";

const STICKER_SIZE = 800;
const CONTENT_RATIO = 0.84;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = source;
  });
}

async function rasterizeSource(source) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function findAlphaBounds(context, width, height) {
  const pixels = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

function normalizeCutout(image) {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  sourceContext.drawImage(image, 0, 0);

  const bounds = findAlphaBounds(sourceContext, sourceCanvas.width, sourceCanvas.height);
  if (!bounds) throw new Error("No foreground object found");

  const boundWidth = bounds.maxX - bounds.minX + 1;
  const boundHeight = bounds.maxY - bounds.minY + 1;
  const padding = Math.max(8, Math.round(Math.min(boundWidth, boundHeight) * 0.035));
  const cropX = Math.max(0, bounds.minX - padding);
  const cropY = Math.max(0, bounds.minY - padding);
  const cropRight = Math.min(sourceCanvas.width, bounds.maxX + padding + 1);
  const cropBottom = Math.min(sourceCanvas.height, bounds.maxY + padding + 1);
  const cropWidth = cropRight - cropX;
  const cropHeight = cropBottom - cropY;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = STICKER_SIZE;
  outputCanvas.height = STICKER_SIZE;
  const outputContext = outputCanvas.getContext("2d");
  outputContext.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);

  // Crop tightly first, then fit the object into a fixed-size sticker frame.
  // This prevents a small object in a large photo from becoming a tiny sticker.
  const scale = Math.min(
    (STICKER_SIZE * CONTENT_RATIO) / cropWidth,
    (STICKER_SIZE * CONTENT_RATIO) / cropHeight
  );
  const drawWidth = cropWidth * scale;
  const drawHeight = cropHeight * scale;
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = "high";
  outputContext.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    (STICKER_SIZE - drawWidth) / 2,
    (STICKER_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  return outputCanvas.toDataURL("image/png");
}

export async function createStickerImage(source) {
  // The model accepts raster images. Camera photos already qualify, while the
  // built-in demo image is SVG, so normalize both paths to PNG first.
  const rasterSource = await rasterizeSource(source);
  const cutoutBlob = await removeBackground(rasterSource, {
    output: { format: "image/png" },
    model: "isnet_quint8"
  });
  const cutoutUrl = URL.createObjectURL(cutoutBlob);

  try {
    const image = await loadImage(cutoutUrl);
    return normalizeCutout(image);
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
}
