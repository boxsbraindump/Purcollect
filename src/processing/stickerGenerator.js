const OUTLINE_WIDTH = 6;
const OUTLINE_SOURCE_PX = 22;

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

function removeBackgroundInWorker(source, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;

    try {
      worker = new Worker(new URL("./stickerBackgroundWorker.js", import.meta.url), { type: "module" });
    } catch (error) {
      reject(error);
      return;
    }

    const cleanup = () => worker.terminate();
    worker.onmessage = (event) => {
      const message = event.data || {};

      if (message.type === "progress") {
        const ratio = message.total > 0 ? message.current / message.total : 0;
        onProgress({
          phase: "extracting",
          progress: Math.round(8 + ratio * 70),
          key: message.key
        });
        return;
      }

      cleanup();
      if (message.type === "result") {
        resolve(message.blob);
      } else {
        reject(new Error(message.message || "Sticker generation failed"));
      }
    };
    worker.onerror = (error) => {
      cleanup();
      reject(error.error || new Error("Sticker worker failed"));
    };
    worker.postMessage({ source });
  });
}

function findAlphaBounds(context, width, height) {
  const pixels = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 18) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

function createWhiteOutline(sourceCanvas, width, height, padding) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskContext = maskCanvas.getContext("2d");
  const sourceX = padding;
  const sourceY = padding;

  // Dilate the alpha mask with small radial offsets, then paint that mask white.
  // This bakes the contour into the PNG instead of relying on CSS or canvas glow.
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    maskContext.drawImage(
      sourceCanvas,
      sourceX + Math.cos(angle) * OUTLINE_SOURCE_PX,
      sourceY + Math.sin(angle) * OUTLINE_SOURCE_PX
    );
  }
  maskContext.globalCompositeOperation = "source-in";
  maskContext.fillStyle = "#ffffff";
  maskContext.fillRect(0, 0, width, height);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputContext = outputCanvas.getContext("2d");
  outputContext.drawImage(maskCanvas, 0, 0);
  outputContext.drawImage(sourceCanvas, sourceX, sourceY);
  return outputCanvas;
}

function preferredScaleFor(aspectRatio) {
  if (aspectRatio > 2.25 || aspectRatio < 0.55) return "small";
  if (aspectRatio > 0.78 && aspectRatio < 1.35) return "large";
  return "medium";
}

function makeStickerAsset(image, width, height) {
  const aspectRatio = width / height;
  return {
    id: `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    image,
    width,
    height,
    aspectRatio,
    preferredScale: preferredScaleFor(aspectRatio),
    collisionShape: { type: "rectangle" },
    collisionPadding: 0.92,
    outlineWidth: OUTLINE_WIDTH,
    shadowPreset: "soft"
  };
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

  const sourceWidth = bounds.maxX - bounds.minX + 1;
  const sourceHeight = bounds.maxY - bounds.minY + 1;
  const cropPadding = Math.max(12, Math.round(Math.min(sourceWidth, sourceHeight) * 0.03));
  const cropX = Math.max(0, bounds.minX - cropPadding);
  const cropY = Math.max(0, bounds.minY - cropPadding);
  const cropRight = Math.min(sourceCanvas.width, bounds.maxX + cropPadding + 1);
  const cropBottom = Math.min(sourceCanvas.height, bounds.maxY + cropPadding + 1);
  const cropWidth = cropRight - cropX;
  const cropHeight = cropBottom - cropY;
  const padding = OUTLINE_SOURCE_PX + 6;

  const cutoutCanvas = document.createElement("canvas");
  cutoutCanvas.width = cropWidth;
  cutoutCanvas.height = cropHeight;
  const cutoutContext = cutoutCanvas.getContext("2d");
  cutoutContext.clearRect(0, 0, cropWidth, cropHeight);
  cutoutContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  const stickerCanvas = createWhiteOutline(cutoutCanvas, cropWidth + padding * 2, cropHeight + padding * 2, padding);
  const stickerImage = stickerCanvas.toDataURL("image/png");
  return makeStickerAsset(stickerImage, stickerCanvas.width, stickerCanvas.height);
}

export async function generateSticker(source, onProgress = () => {}) {
  // Camera photos already qualify, while the demo image is SVG. Rasterizing both
  // paths keeps the generator interface stable for future Vision/native adapters.
  onProgress({ phase: "preparing", progress: 4 });
  const rasterSource = await rasterizeSource(source);
  onProgress({ phase: "extracting", progress: 8 });
  const cutoutBlob = await removeBackgroundInWorker(rasterSource, onProgress);
  const cutoutUrl = URL.createObjectURL(cutoutBlob);

  try {
    onProgress({ phase: "outlining", progress: 86 });
    const image = await loadImage(cutoutUrl);
    const asset = normalizeCutout(image);
    onProgress({ phase: "ready", progress: 100 });
    return asset;
  } finally {
    URL.revokeObjectURL(cutoutUrl);
  }
}
