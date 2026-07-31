"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  processCanvasImage,
  parseAspectRatioPreset,
  ImageTransformOptions,
} from "../utils/imageUtils";

export interface ProductImageEditorProps {
  isOpen: boolean;
  imageUrl: string;
  onSave: (blob: Blob, dataUrl: string) => Promise<void> | void;
  onClose: () => void;
}

export function ProductImageEditor({
  isOpen,
  imageUrl,
  onSave,
  onClose,
}: ProductImageEditorProps) {
  const [aspectRatioPreset, setAspectRatioPreset] = useState<string>("4:5");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [fillWhiteBg, setFillWhiteBg] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 800, height: 1000 });
  const [cropBox, setCropBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 800, height: 1000 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load natural image dimensions when modal opens or imageUrl changes
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 1000;
      setNaturalDimensions({ width: w, height: h });
      setCropBox({ x: 0, y: 0, width: w, height: h });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setAspectRatioPreset("4:5");
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Recalculate crop when aspect ratio preset changes
  useEffect(() => {
    const ratio = parseAspectRatioPreset(aspectRatioPreset);
    if (ratio && naturalDimensions.width > 0 && naturalDimensions.height > 0) {
      const isRotated90 = rotation === 90 || rotation === 270;
      const baseW = isRotated90
        ? naturalDimensions.height
        : naturalDimensions.width;
      const baseH = isRotated90
        ? naturalDimensions.width
        : naturalDimensions.height;

      let newW = baseW;
      let newH = baseW / ratio;

      if (newH > baseH) {
        newH = baseH;
        newW = baseH * ratio;
      }

      const newX = (baseW - newW) / 2;
      const newY = (baseH - newH) / 2;
      setCropBox({
        x: Math.max(0, newX),
        y: Math.max(0, newY),
        width: newW,
        height: newH,
      });
    }
  }, [aspectRatioPreset, naturalDimensions, rotation]);

  // Update canvas preview
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    let isSubscribed = true;
    const updatePreview = async () => {
      try {
        const options: ImageTransformOptions = {
          crop: cropBox,
          rotation,
          flipH,
          flipV,
          brightness,
          contrast,
          saturation,
          fillWhiteBg,
          aspectRatioPreset,
        };
        const { dataUrl } = await processCanvasImage(imageUrl, options);
        if (isSubscribed) {
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error("Failed to generate image preview", err);
      }
    };

    updatePreview();
    return () => {
      isSubscribed = false;
    };
  }, [
    isOpen,
    imageUrl,
    cropBox,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    fillWhiteBg,
    aspectRatioPreset,
  ]);

  if (!isOpen) return null;

  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const options: ImageTransformOptions = {
        crop: cropBox,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation,
        fillWhiteBg,
        aspectRatioPreset,
      };
      const { blob, dataUrl } = await processCanvasImage(imageUrl, options);
      await onSave(blob, dataUrl);
      onClose();
    } catch (err) {
      console.error("Error saving edited image:", err);
      alert("Failed to save edited image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#121319",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#E2E8F0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px", color: "#D4AF37" }}>✦</span>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#F8FAFC",
              }}
            >
              Product Image Editor
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* Canvas Preview Area */}
          <div
            style={{
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#090A0F",
              position: "relative",
              minHeight: "400px",
            }}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Edited Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "480px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            ) : (
              <div style={{ color: "#64748B", fontSize: "14px" }}>
                Loading editor preview...
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div
            style={{
              padding: "20px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              overflowY: "auto",
              background: "#121319",
            }}
          >
            {/* Aspect Ratio Presets */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Aspect Ratio Frame
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                }}
              >
                {[
                  { label: "4:5 Store", value: "4:5" },
                  { label: "1:1 Square", value: "1:1" },
                  { label: "3:4 Portrait", value: "3:4" },
                  { label: "16:9 Banner", value: "16:9" },
                  { label: "9:16 Story", value: "9:16" },
                  { label: "Freeform", value: "free" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setAspectRatioPreset(preset.value)}
                    style={{
                      padding: "8px 4px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      border:
                        aspectRatioPreset === preset.value
                          ? "1px solid #D4AF37"
                          : "1px solid rgba(255,255,255,0.1)",
                      background:
                        aspectRatioPreset === preset.value
                          ? "rgba(212, 175, 55, 0.15)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        aspectRatioPreset === preset.value
                          ? "#F3E5AB"
                          : "#94A3B8",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation & Flip */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Transform
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "6px",
                }}
              >
                <button
                  onClick={handleRotateLeft}
                  title="Rotate 90° Left"
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#CBD5E1",
                    cursor: "pointer",
                  }}
                >
                  ↺ 90°
                </button>
                <button
                  onClick={handleRotateRight}
                  title="Rotate 90° Right"
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#CBD5E1",
                    cursor: "pointer",
                  }}
                >
                  ↻ 90°
                </button>
                <button
                  onClick={() => setFlipH(!flipH)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: flipH
                      ? "1px solid #D4AF37"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: flipH
                      ? "rgba(212, 175, 55, 0.15)"
                      : "rgba(255,255,255,0.03)",
                    color: flipH ? "#F3E5AB" : "#CBD5E1",
                    cursor: "pointer",
                  }}
                >
                  ⇄ Flip
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: flipV
                      ? "1px solid #D4AF37"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: flipV
                      ? "rgba(212, 175, 55, 0.15)"
                      : "rgba(255,255,255,0.03)",
                    color: flipV ? "#F3E5AB" : "#CBD5E1",
                    cursor: "pointer",
                  }}
                >
                  ⇅ Flip
                </button>
              </div>
            </div>

            {/* Adjustments */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Adjustments
              </label>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}
                >
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#D4AF37" }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}
                >
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#D4AF37" }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}
                >
                  <span>Saturation</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#D4AF37" }}
                />
              </div>
            </div>

            {/* Background options */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: "14px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#CBD5E1",
                }}
              >
                <input
                  type="checkbox"
                  checked={fillWhiteBg}
                  onChange={(e) => setFillWhiteBg(e.target.checked)}
                  style={{ accentColor: "#D4AF37" }}
                />
                Solid White Background Fill
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#CBD5E1",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
              color: "#0B0C10",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(212, 175, 55, 0.25)",
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            {isProcessing ? "Saving & Uploading..." : "Save & Apply Image"}
          </button>
        </div>
      </div>
    </div>
  );
}
