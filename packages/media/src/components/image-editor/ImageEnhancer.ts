/**
 * Luminance & Histogram Auto-Enhance Engine for ProductImageEditor
 */

export interface AutoEnhanceResult {
  brightness: number;
  contrast: number;
  saturation: number;
  message: string;
}

export async function runAutoEnhance(
  imgElement: HTMLImageElement,
): Promise<AutoEnhanceResult> {
  const SAMP = 100;
  const canvas = document.createElement("canvas");
  canvas.width = SAMP;
  canvas.height = SAMP;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  ctx.drawImage(imgElement, 0, 0, SAMP, SAMP);
  const { data } = ctx.getImageData(0, 0, SAMP, SAMP);

  let lumSum = 0;
  let minL = 255;
  let maxL = 0;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  const n = SAMP * SAMP;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    lumSum += lum;
    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;
    rSum += r;
    gSum += g;
    bSum += b;
  }

  const avgLum = lumSum / n;
  const spread = maxL - minL;

  let brightness = 100;
  let contrast = 100;
  let saturation = 100;
  const notes: string[] = [];

  if (avgLum < 100) {
    brightness = 115;
    notes.push("Boosted exposure (+15%)");
  } else if (avgLum > 200) {
    brightness = 90;
    notes.push("Reduced glare (-10%)");
  }

  if (spread < 120) {
    contrast = 120;
    notes.push("Expanded dynamic contrast (+20%)");
  }

  saturation = 110;
  notes.push("Accentuating finish tones (+10%)");

  return {
    brightness,
    contrast,
    saturation,
    message: notes.join(" • ") || "Optimal balanced exposure detected.",
  };
}
