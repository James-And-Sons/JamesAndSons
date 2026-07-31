export interface ImageTransformOptions {
  crop?: {
    x: number; // percentage 0-100 or px
    y: number;
    width: number;
    height: number;
  };
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
  brightness?: number; // 50 to 150 (default 100)
  contrast?: number; // 50 to 150 (default 100)
  saturation?: number; // 0 to 200 (default 100)
  aspectRatioPreset?: string; // 'free' | '1:1' | '4:5' | '3:4' | '16:9' | '9:16'
  fillWhiteBg?: boolean;
}

export function parseAspectRatioPreset(preset: string): number | null {
  switch (preset) {
    case "1:1":
      return 1;
    case "4:5":
      return 4 / 5;
    case "3:4":
      return 3 / 4;
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
    default:
      return null;
  }
}

/**
 * Loads an image from URL and resolves with its natural dimensions.
 */
export function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const aspectRatio = height > 0 ? width / height : 1;
      resolve({ width, height, aspectRatio });
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Processes an image on an HTML5 canvas and converts it to a Blob or DataURL.
 */
export async function processCanvasImage(
  imageSource: HTMLImageElement | string,
  options: ImageTransformOptions,
): Promise<{ blob: Blob; dataUrl: string }> {
  let img: HTMLImageElement;
  if (typeof imageSource === "string") {
    img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2d canvas context");
  }

  const rotation = options.rotation || 0;
  const flipH = !!options.flipH;
  const flipV = !!options.flipV;
  const brightness = options.brightness ?? 100;
  const contrast = options.contrast ?? 100;
  const saturation = options.saturation ?? 100;

  // Determine base dimensions after rotation
  const isRotated90 = rotation === 90 || rotation === 270;
  const baseWidth = isRotated90 ? img.naturalHeight : img.naturalWidth;
  const baseHeight = isRotated90 ? img.naturalWidth : img.naturalHeight;

  // Handle crop rect
  const crop = options.crop || {
    x: 0,
    y: 0,
    width: baseWidth,
    height: baseHeight,
  };
  const targetWidth = Math.max(1, Math.round(crop.width));
  const targetHeight = Math.max(1, Math.round(crop.height));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // White background option if requested
  if (options.fillWhiteBg) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Apply filters
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  // Apply transformations
  ctx.save();

  // Move origin to center of target canvas
  ctx.translate(targetWidth / 2, targetHeight / 2);

  // Apply flip
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Apply rotation
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw image taking crop offset into account
  const sourceCenterX = crop.x + crop.width / 2;
  const sourceCenterY = crop.y + crop.height / 2;

  if (isRotated90) {
    ctx.drawImage(
      img,
      -baseHeight / 2 + (baseHeight / 2 - sourceCenterY),
      -baseWidth / 2 + (baseWidth / 2 - sourceCenterX),
      img.naturalWidth,
      img.naturalHeight,
    );
  } else {
    ctx.drawImage(
      img,
      -sourceCenterX,
      -sourceCenterY,
      img.naturalWidth,
      img.naturalHeight,
    );
  }

  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas blob generation failed"));
      },
      "image/jpeg",
      0.92,
    );
  });

  return { blob, dataUrl };
}
