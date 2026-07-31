"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  processCanvasImage,
  parseAspectRatioPreset,
  ImageTransformOptions,
} from "../utils/imageUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductImageEditorProps {
  isOpen: boolean;
  imageUrl: string;
  onSave: (blob: Blob, dataUrl: string) => Promise<void> | void;
  onClose: () => void;
  /** Optional callback to generate AI alt-text from edited image dataUrl */
  onGenerateAltText?: (dataUrl: string) => Promise<string>;
}

function getEffectiveDimensions(natW: number, natH: number, rotation: number) {
  const isRotated90 = rotation === 90 || rotation === 270;
  return {
    effW: isRotated90 ? natH : natW,
    effH: isRotated90 ? natW : natH,
  };
}

async function runAutoEnhance(
  imgElement: HTMLImageElement,
): Promise<{
  brightness: number;
  contrast: number;
  saturation: number;
  message: string;
}> {
  const SAMP = 100;
  const canvas = document.createElement("canvas");
  canvas.width = SAMP;
  canvas.height = SAMP;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  ctx.drawImage(imgElement, 0, 0, SAMP, SAMP);
  const { data } = ctx.getImageData(0, 0, SAMP, SAMP);

  let lumSum = 0,
    minL = 255,
    maxL = 0;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  const n = SAMP * SAMP;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lumSum += l;
    rSum += r;
    gSum += g;
    bSum += b;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }

  const avgL = lumSum / n;
  const range = maxL - minL;
  const avgR = rSum / n,
    avgG = gSum / n,
    avgB = bSum / n;
  const colorVar =
    Math.abs(avgR - avgG) + Math.abs(avgG - avgB) + Math.abs(avgR - avgB);

  const newBrightness = Math.round(
    Math.min(140, Math.max(70, 100 * (132 / Math.max(1, avgL)))),
  );
  const newContrast = range < 85 ? 116 : range < 140 ? 108 : 100;
  const newSaturation = colorVar < 20 ? 122 : colorVar < 45 ? 110 : 100;

  const parts: string[] = [];
  if (newBrightness !== 100)
    parts.push(
      `brightness ${newBrightness > 100 ? "+" : ""}${newBrightness - 100}%`,
    );
  if (newContrast !== 100) parts.push(`contrast +${newContrast - 100}%`);
  if (newSaturation !== 100) parts.push(`saturation +${newSaturation - 100}%`);

  return {
    brightness: newBrightness,
    contrast: newContrast,
    saturation: newSaturation,
    message: parts.length
      ? `✓ Enhanced (${parts.join(", ")})`
      : "✓ Contrast is already balanced",
  };
}

const ASPECT_PRESETS = [
  { label: "4:5", value: "4:5" },
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "Original", value: "free" },
];

export function ProductImageEditor({
  isOpen,
  imageUrl,
  onSave,
  onClose,
  onGenerateAltText,
}: ProductImageEditorProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [aspectRatio, setAspectRatio] = useState<string>("4:5");
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  const [fillWhiteBg, setFillWhiteBg] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [vignette, setVignette] = useState<boolean>(false);

  const [natW, setNatW] = useState<number>(1000);
  const [natH, setNatH] = useState<number>(1250);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [enhancing, setEnhancing] = useState<boolean>(false);
  const [enhanceMsg, setEnhanceMsg] = useState<string>("");

  const [altText, setAltText] = useState<string>("");
  const [altTextLoading, setAltTextLoading] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const touchStartRef = useRef<{
    dist: number;
    initZoom: number;
    p1X: number;
    p1Y: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);
  const mouseStartRef = useRef<{
    startX: number;
    startY: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFillWhiteBg(false);
    setSharpen(false);
    setVignette(false);
    setAspectRatio("4:5");
    setEnhanceMsg("");
    setAltText("");

    const img = new Image();
    img.crossOrigin = "anonymous";

    const handleSuccess = () => {
      const w = img.naturalWidth || 1000;
      const h = img.naturalHeight || 1250;
      setNatW(w);
      setNatH(h);
      loadedImgRef.current = img;
    };

    img.onload = handleSuccess;
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        const w = fallbackImg.naturalWidth || 1000;
        const h = fallbackImg.naturalHeight || 1250;
        setNatW(w);
        setNatH(h);
        loadedImgRef.current = fallbackImg;
      };
      fallbackImg.src = imageUrl;
    };

    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Reset pan/zoom on aspect ratio or rotation change
  useEffect(() => {
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
  }, [aspectRatio, rotation]);

  // ── Workspace & Crop Layout ────────────────────────────────────────────────
  const workspaceLayout = useMemo(() => {
    const { effW, effH } = getEffectiveDimensions(natW, natH, rotation);
    const parsedRatio = parseAspectRatioPreset(aspectRatio);
    const targetAspect = parsedRatio ?? effW / effH;

    // Workspace container size
    const wsW = isMobile ? Math.min(340, window.innerWidth - 32) : 500;
    const wsH = isMobile ? 280 : 390;

    // Crop box size inside workspace
    let cropW: number, cropH: number;
    if (wsW / targetAspect <= wsH) {
      cropW = wsW * 0.9;
      cropH = cropW / targetAspect;
    } else {
      cropH = wsH * 0.9;
      cropW = cropH * targetAspect;
    }

    cropW = Math.round(Math.max(80, cropW));
    cropH = Math.round(Math.max(80, cropH));

    // Image scale so it covers the crop frame at zoom = 1.0
    const baseScale = Math.max(cropW / effW, cropH / effH);
    const totalScale = baseScale * zoom;

    // Pan limits
    const maxPanX = Math.max(0, (effW * totalScale - cropW) / 2);
    const maxPanY = Math.max(0, (effH * totalScale - cropH) / 2);

    return {
      effW,
      effH,
      wsW,
      wsH,
      cropW,
      cropH,
      baseScale,
      totalScale,
      maxPanX,
      maxPanY,
    };
  }, [natW, natH, rotation, aspectRatio, zoom, isMobile]);

  const clampedPanX = Math.max(
    -workspaceLayout.maxPanX,
    Math.min(workspaceLayout.maxPanX, panX),
  );
  const clampedPanY = Math.max(
    -workspaceLayout.maxPanY,
    Math.min(workspaceLayout.maxPanY, panY),
  );

  // ── Mouse Drag Pan ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      mouseStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: panX,
        initPanY: panY,
      };
      setIsDragging(true);
    },
    [panX, panY],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!mouseStartRef.current) return;
      const { startX, startY, initPanX, initPanY } = mouseStartRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      setPanX(
        Math.max(
          -workspaceLayout.maxPanX,
          Math.min(workspaceLayout.maxPanX, initPanX + dx),
        ),
      );
      setPanY(
        Math.max(
          -workspaceLayout.maxPanY,
          Math.min(workspaceLayout.maxPanY, initPanY + dy),
        ),
      );
    },
    [workspaceLayout],
  );

  const handleMouseUp = useCallback(() => {
    mouseStartRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ── Touch Gesture (Pinch-to-Zoom & Pan) ───────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY,
        );
        touchStartRef.current = {
          dist,
          initZoom: zoom,
          p1X: t1.clientX,
          p1Y: t1.clientY,
          initPanX: panX,
          initPanY: panY,
        };
      } else if (e.touches.length === 1) {
        const t1 = e.touches[0];
        touchStartRef.current = {
          dist: 0,
          initZoom: zoom,
          p1X: t1.clientX,
          p1Y: t1.clientY,
          initPanX: panX,
          initPanY: panY,
        };
        setIsDragging(true);
      }
    },
    [zoom, panX, panY],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current) return;

      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(
          t2.clientX - t1.clientX,
          t2.clientY - t1.clientY,
        );
        const scale = newDist / touchStartRef.current.dist;
        const targetZoom = Math.min(
          3.5,
          Math.max(1.0, touchStartRef.current.initZoom * scale),
        );
        setZoom(Math.round(targetZoom * 100) / 100);
      } else if (e.touches.length === 1 && touchStartRef.current.dist === 0) {
        const t1 = e.touches[0];
        const dx = t1.clientX - touchStartRef.current.p1X;
        const dy = t1.clientY - touchStartRef.current.p1Y;
        setPanX(
          Math.max(
            -workspaceLayout.maxPanX,
            Math.min(
              workspaceLayout.maxPanX,
              touchStartRef.current.initPanX + dx,
            ),
          ),
        );
        setPanY(
          Math.max(
            -workspaceLayout.maxPanY,
            Math.min(
              workspaceLayout.maxPanY,
              touchStartRef.current.initPanY + dy,
            ),
          ),
        );
      }
    },
    [workspaceLayout],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsDragging(false);
  }, []);

  // ── Wheel / Trackpad Zoom ──────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.003;
    setZoom((z) =>
      Math.min(3.5, Math.max(1.0, Math.round((z + delta) * 100) / 100)),
    );
  }, []);

  // ── Export Crop Box Math ───────────────────────────────────────────────────
  const getExportCropBox = useCallback(() => {
    const { effW, effH, totalScale, cropW, cropH } = workspaceLayout;

    const cropEffWidth = Math.min(effW, cropW / totalScale);
    const cropEffHeight = Math.min(effH, cropH / totalScale);

    let effPanX = clampedPanX / totalScale;
    let effPanY = clampedPanY / totalScale;

    if (flipH) effPanX = -effPanX;
    if (flipV) effPanY = -effPanY;

    const centerEffX = effW / 2 - effPanX;
    const centerEffY = effH / 2 - effPanY;

    const cropX = Math.max(
      0,
      Math.min(effW - cropEffWidth, centerEffX - cropEffWidth / 2),
    );
    const cropY = Math.max(
      0,
      Math.min(effH - cropEffHeight, centerEffY - cropEffHeight / 2),
    );

    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropEffWidth),
      height: Math.round(cropEffHeight),
    };
  }, [workspaceLayout, clampedPanX, clampedPanY, flipH, flipV]);

  // ── Save Handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const crop = getExportCropBox();
      const options: ImageTransformOptions = {
        crop,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation,
        fillWhiteBg,
        sharpen,
        vignette,
      };

      const sourceToProcess = loadedImgRef.current || imageUrl;
      const { blob, dataUrl } = await processCanvasImage(
        sourceToProcess,
        options,
      );
      await onSave(blob, dataUrl);
      onClose();
    } catch (err: any) {
      console.error("[ProductImageEditor] Save Error:", err);
      alert(`Save failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── AI Alt Text Generator Handler ──────────────────────────────────────────
  const handleGenerateAltText = async () => {
    if (!onGenerateAltText) return;
    setAltTextLoading(true);
    try {
      const crop = getExportCropBox();
      const options: ImageTransformOptions = {
        crop,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation,
        fillWhiteBg,
        sharpen,
        vignette,
      };
      const sourceToProcess = loadedImgRef.current || imageUrl;
      const { dataUrl } = await processCanvasImage(sourceToProcess, options);
      const text = await onGenerateAltText(dataUrl);
      setAltText(text);
    } catch {
      setAltText("⚠️ Failed to generate alt text.");
    } finally {
      setAltTextLoading(false);
    }
  };

  // ── Auto Enhance Handler ───────────────────────────────────────────────────
  const handleAutoEnhanceClick = async () => {
    if (!loadedImgRef.current) return;
    setEnhancing(true);
    setEnhanceMsg("");
    try {
      const res = await runAutoEnhance(loadedImgRef.current);
      setBrightness(res.brightness);
      setContrast(res.contrast);
      setSaturation(res.saturation);
      setEnhanceMsg(res.message);
    } catch {
      setEnhanceMsg("⚠ Enhancer unavailable.");
    } finally {
      setEnhancing(false);
    }
  };

  if (!isOpen) return null;

  const isRotated90 = rotation === 90 || rotation === 270;
  const displayImgW = isRotated90
    ? natH * workspaceLayout.totalScale
    : natW * workspaceLayout.totalScale;
  const displayImgH = isRotated90
    ? natW * workspaceLayout.totalScale
    : natH * workspaceLayout.totalScale;

  return (
    <>
      <style>{`@keyframes _editorSpin{to{transform:rotate(360deg)}}`}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.82)",
          backdropFilter: "blur(8px)",
          padding: isMobile ? "0" : "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#161822",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: isMobile ? "0" : "14px",
            width: "100%",
            maxWidth: "960px",
            height: isMobile ? "100dvh" : "auto",
            maxHeight: isMobile ? "100dvh" : "94vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            color: "#FFFFFF",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* ── Modal Header ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#1E202C",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, color: "#D4AF37" }}>✦</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
                Product Image Studio
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#D4AF37",
                  background: "rgba(212, 175, 55, 0.15)",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {natW} × {natH}px
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                borderRadius: 6,
                width: 32,
                height: 32,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* ── Modal Body ───────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* ── LEFT: Workspace & Crop Frame ────────────────────────────── */}
            <div
              style={{
                flex: isMobile ? "none" : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#0D0E15",
                padding: "24px 16px",
                gap: 14,
                userSelect: "none",
                position: "relative",
              }}
            >
              {/* Workspace Container */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                style={{
                  width: workspaceLayout.wsW,
                  height: workspaceLayout.wsH,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: 8,
                  background: fillWhiteBg ? "#FFFFFF" : "#141622",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              >
                {/* Product Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Product preview"
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: displayImgW,
                    height: displayImgH,
                    transform: [
                      `translate(${clampedPanX}px, ${clampedPanY}px)`,
                      `rotate(${rotation}deg)`,
                      `scaleX(${flipH ? -1 : 1})`,
                      `scaleY(${flipV ? -1 : 1})`,
                    ].join(" "),
                    transformOrigin: "center center",
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                    pointerEvents: "none",
                    display: "block",
                    objectFit: "contain",
                  }}
                />

                {/* Outer Dark Tint (Mask outside crop frame) */}
                <div
                  style={{
                    position: "absolute",
                    width: workspaceLayout.cropW,
                    height: workspaceLayout.cropH,
                    outline: "999px solid rgba(0, 0, 0, 0.48)",
                    borderRadius: 2,
                    pointerEvents: "none",
                    border: `2px solid ${isDragging ? "#D4AF37" : "rgba(212, 175, 55, 0.9)"}`,
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {/* Rule of Thirds Grid Lines */}
                  {[33.33, 66.67].map((pct) => (
                    <React.Fragment key={pct}>
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: `${pct}%`,
                          width: 1,
                          background: "rgba(212, 175, 55, 0.35)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: `${pct}%`,
                          height: 1,
                          background: "rgba(212, 175, 55, 0.35)",
                        }}
                      />
                    </React.Fragment>
                  ))}
                  {/* Corner Accent Handles */}
                  <div
                    style={{
                      position: "absolute",
                      top: -4,
                      left: -4,
                      width: 10,
                      height: 10,
                      borderTop: "3px solid #D4AF37",
                      borderLeft: "3px solid #D4AF37",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 10,
                      height: 10,
                      borderTop: "3px solid #D4AF37",
                      borderRight: "3px solid #D4AF37",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: -4,
                      width: 10,
                      height: 10,
                      borderBottom: "3px solid #D4AF37",
                      borderLeft: "3px solid #D4AF37",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 10,
                      height: 10,
                      borderBottom: "3px solid #D4AF37",
                      borderRight: "3px solid #D4AF37",
                    }}
                  />
                </div>

                {/* Zoom Badge */}
                {zoom > 1.01 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "#F3E5AB",
                      background: "rgba(0, 0, 0, 0.85)",
                      padding: "3px 9px",
                      borderRadius: 4,
                      pointerEvents: "none",
                      border: "1px solid #D4AF37",
                      fontWeight: 700,
                    }}
                  >
                    {Math.round(zoom * 100)}%
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                    fontFamily: "monospace",
                  }}
                >
                  🤌 Pinch / Scroll wheel to zoom · Drag image to position crop
                </span>
              </div>

              {/* Zoom Control Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#1E202C",
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(1.0, Math.round((z - 0.15) * 100) / 100),
                    )
                  }
                  disabled={zoom <= 1.0}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    background:
                      zoom <= 1.0
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(255, 255, 255, 0.12)",
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: zoom <= 1.0 ? "default" : "pointer",
                    opacity: zoom <= 1.0 ? 0.35 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  −
                </button>

                <div
                  style={{
                    minWidth: 70,
                    textAlign: "center",
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: "#D4AF37",
                    fontWeight: 700,
                  }}
                >
                  {Math.round(zoom * 100)}%
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(3.5, Math.round((z + 0.15) * 100) / 100),
                    )
                  }
                  disabled={zoom >= 3.5}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    background:
                      zoom >= 3.5
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(255, 255, 255, 0.12)",
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: zoom >= 3.5 ? "default" : "pointer",
                    opacity: zoom >= 3.5 ? 0.35 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>

                {zoom > 1.01 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setPanX(0);
                      setPanY(0);
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 5,
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#F8FAFC",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Feedback message */}
              {enhanceMsg && (
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#4ADE80",
                    background: "rgba(74, 222, 128, 0.12)",
                    border: "1px solid rgba(74, 222, 128, 0.35)",
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {enhanceMsg}
                </div>
              )}
            </div>

            {/* ── RIGHT: Clean Control Panel ─────────────────────────────── */}
            <div
              style={{
                width: isMobile ? "100%" : 320,
                borderLeft: isMobile
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.15)",
                borderTop: isMobile
                  ? "1px solid rgba(255, 255, 255, 0.15)"
                  : "none",
                overflowY: "auto",
                background: "#191B26",
              }}
            >
              {/* ── Aspect Ratio Presets ─────────────────────────────────── */}
              <Section label="Aspect Ratio">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                  }}
                >
                  {ASPECT_PRESETS.map((p) => {
                    const isSelected = aspectRatio === p.value;
                    return (
                      <button
                        type="button"
                        key={p.value}
                        onClick={() => setAspectRatio(p.value)}
                        style={{
                          padding: "10px 4px",
                          fontSize: 12,
                          borderRadius: 6,
                          cursor: "pointer",
                          border: isSelected
                            ? "2px solid #D4AF37"
                            : "1px solid rgba(255, 255, 255, 0.25)",
                          background: isSelected
                            ? "#D4AF37"
                            : "rgba(255, 255, 255, 0.08)",
                          color: isSelected ? "#000000" : "#FFFFFF",
                          fontWeight: 700,
                          fontFamily: "monospace",
                          transition: "all 0.12s",
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* ── Transform (Rotate & Flip) ────────────────────────────── */}
              <Section label="Transform">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    title="Rotate 90° Left"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    style={btnStyle(false)}
                  >
                    ↺ 90°
                  </button>
                  <button
                    type="button"
                    title="Rotate 90° Right"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    style={btnStyle(false)}
                  >
                    ↻ 90°
                  </button>
                  <button
                    type="button"
                    title="Flip Horizontally"
                    onClick={() => setFlipH((f) => !f)}
                    style={btnStyle(flipH)}
                  >
                    ⇄ Flip H
                  </button>
                  <button
                    type="button"
                    title="Flip Vertically"
                    onClick={() => setFlipV((f) => !f)}
                    style={btnStyle(flipV)}
                  >
                    ⇅ Flip V
                  </button>
                </div>
                {rotation !== 0 && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 11,
                      color: "#D4AF37",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    Rotation: {rotation}°
                  </p>
                )}
              </Section>

              {/* ── Image Adjustments ────────────────────────────────────── */}
              <Section label="Adjustments">
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={handleAutoEnhanceClick}
                    disabled={enhancing}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: "1px solid #D4AF37",
                      background: "rgba(212, 175, 55, 0.2)",
                      color: "#F3E5AB",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {enhancing ? "Analysing…" : "⚡ Auto Enhance"}
                  </button>
                  <button
                    type="button"
                    title="Reset all adjustments"
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setEnhanceMsg("");
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 6,
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    ↺
                  </button>
                </div>

                {[
                  {
                    label: "Brightness",
                    val: brightness,
                    set: setBrightness,
                    min: 50,
                    max: 150,
                  },
                  {
                    label: "Contrast",
                    val: contrast,
                    set: setContrast,
                    min: 50,
                    max: 150,
                  },
                  {
                    label: "Saturation",
                    val: saturation,
                    set: setSaturation,
                    min: 0,
                    max: 200,
                  },
                ].map(({ label, val, set, min, max }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#FFFFFF",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      <span>{label}</span>
                      <span
                        style={{
                          color: val !== 100 ? "#D4AF37" : "#CBD5E1",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {val}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={val}
                      onChange={(e) => set(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: "#D4AF37",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </Section>

              {/* ── Filters & Background ─────────────────────────────────── */}
              <Section label="Style & Background">
                {[
                  {
                    label: "Sharpen Detail",
                    desc: "Crisp product edges",
                    val: sharpen,
                    set: setSharpen,
                  },
                  {
                    label: "Luxury Vignette",
                    desc: "Radial dark corner edges",
                    val: vignette,
                    set: setVignette,
                  },
                  {
                    label: "White Background",
                    desc: "Solid white background",
                    val: fillWhiteBg,
                    set: setFillWhiteBg,
                  },
                ].map(({ label, desc, val, set }) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => set((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginBottom: 8,
                      border: val
                        ? "2px solid #D4AF37"
                        : "1px solid rgba(255, 255, 255, 0.25)",
                      background: val
                        ? "rgba(212, 175, 55, 0.2)"
                        : "rgba(255, 255, 255, 0.08)",
                      color: val ? "#F3E5AB" : "#FFFFFF",
                      textAlign: "left",
                      transition: "all 0.12s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        {label}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2 }}
                      >
                        {desc}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 18,
                        borderRadius: 9,
                        flexShrink: 0,
                        background: val
                          ? "#D4AF37"
                          : "rgba(255, 255, 255, 0.2)",
                        position: "relative",
                        transition: "background 0.18s",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          borderRadius: "50%",
                          width: 14,
                          height: 14,
                          left: val ? 16 : 2,
                          background: val ? "#000000" : "#FFFFFF",
                          transition: "left 0.18s",
                        }}
                      />
                    </div>
                  </button>
                ))}
              </Section>

              {/* ── AI Alt Text Generator ────────────────────────────────── */}
              {onGenerateAltText && (
                <Section label="AI Alt Text">
                  <button
                    type="button"
                    onClick={handleGenerateAltText}
                    disabled={altTextLoading}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      background: "rgba(255, 255, 255, 0.12)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 8,
                      opacity: altTextLoading ? 0.6 : 1,
                    }}
                  >
                    {altTextLoading
                      ? "⏳ Generating Alt Text…"
                      : "🤖 Generate Alt Text"}
                  </button>
                  {altText && (
                    <textarea
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: 6,
                        padding: "8px",
                        color: "#FFFFFF",
                        fontSize: 11,
                        lineHeight: 1.4,
                        fontFamily: "system-ui",
                        fontWeight: 500,
                      }}
                    />
                  )}
                </Section>
              )}
            </div>
          </div>

          {/* ── Modal Footer ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              background: "#1E202C",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.25)",
                background: "transparent",
                color: "#FFFFFF",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              style={{
                padding: "10px 26px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
                color: "#000000",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(212, 175, 55, 0.35)",
                opacity: isProcessing ? 0.65 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isProcessing && (
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.3)",
                    borderTopColor: "#000000",
                    animation: "_editorSpin 0.7s linear infinite",
                  }}
                />
              )}
              {isProcessing ? "Saving Image…" : "Save & Apply"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 11,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#F1F5F9",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 0",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    border: active
      ? "2px solid #D4AF37"
      : "1px solid rgba(255, 255, 255, 0.25)",
    background: active ? "#D4AF37" : "rgba(255, 255, 255, 0.08)",
    color: active ? "#000000" : "#FFFFFF",
    fontWeight: 700,
    transition: "all 0.12s",
  };
}
