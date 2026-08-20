"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  processCanvasImage,
  parseAspectRatioPreset,
} from "../utils/imageUtils";
import { runAutoEnhance } from "./image-editor/ImageEnhancer";
import ImageToolbar from "./image-editor/ImageToolbar";
import { X, Check } from "lucide-react";

export interface ProductImageEditorProps {
  isOpen: boolean;
  imageUrl: string;
  onSave: (blob: Blob, dataUrl: string) => Promise<void> | void;
  onClose: () => void;
  onGenerateAltText?: (dataUrl: string) => Promise<string>;
}

export default function ProductImageEditor({
  isOpen,
  imageUrl,
  onSave,
  onClose,
}: ProductImageEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState("original");
  const [whiteBg, setWhiteBg] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceMessage, setEnhanceMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setAspectRatio("original");
    setWhiteBg(false);
    setWatermarkText("");
    setEnhanceMessage("");
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleAutoEnhance = async () => {
    if (!imageRef.current) return;
    setIsEnhancing(true);
    try {
      const res = await runAutoEnhance(imageRef.current);
      setBrightness(res.brightness);
      setContrast(res.contrast);
      setSaturation(res.saturation);
      setEnhanceMessage(res.message);
    } catch (err) {
      console.error("Auto enhance error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const renderPreview = useCallback(async () => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });
    imageRef.current = img;

    const ratio = parseAspectRatioPreset(aspectRatio);

    const { blob, dataUrl } = await processCanvasImage(img, {
      brightness,
      contrast,
      saturation,
      rotation,
      fillWhiteBg: whiteBg,
      aspectRatioPreset: ratio ? aspectRatio : undefined,
    });

    setPreviewDataUrl(dataUrl);
    setCurrentBlob(blob);
  }, [
    imageUrl,
    brightness,
    contrast,
    saturation,
    rotation,
    aspectRatio,
    whiteBg,
  ]);

  useEffect(() => {
    if (isOpen) {
      renderPreview();
    }
  }, [isOpen, renderPreview]);

  const handleSaveClick = async () => {
    if (!currentBlob || !previewDataUrl) return;
    setIsSaving(true);
    try {
      await onSave(currentBlob, previewDataUrl);
      onClose();
    } catch (err) {
      console.error("Save canvas image error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-5xl h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-text">
              Studio Product Image Editor
            </h3>
            <p className="text-xs text-textMuted">
              Enhance exposure, transform aspect ratios, & generate studio white
              backgrounds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded text-xs text-textMuted hover:text-text hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="px-4 py-2 bg-gold text-obsidian font-semibold rounded text-xs hover:brightness-110 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{isSaving ? "Saving..." : "Apply & Save"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Viewport */}
          <div className="flex-1 bg-black/40 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {enhanceMessage && (
              <div className="absolute top-4 left-4 right-4 bg-gold/15 border border-gold/40 text-gold text-xs p-2.5 rounded text-center font-mono z-10">
                {enhanceMessage}
              </div>
            )}
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Studio preview"
                className="max-w-full max-h-full object-contain rounded shadow-lg"
              />
            ) : (
              <div className="text-xs text-textMuted font-mono">
                Rendering Studio Preview...
              </div>
            )}
          </div>

          {/* Right Toolbar */}
          <ImageToolbar
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            rotation={rotation}
            aspectRatio={aspectRatio}
            whiteBg={whiteBg}
            watermarkText={watermarkText}
            onBrightnessChange={setBrightness}
            onContrastChange={setContrast}
            onSaturationChange={setSaturation}
            onRotate={handleRotate}
            onAspectRatioChange={setAspectRatio}
            onWhiteBgToggle={() => setWhiteBg((prev) => !prev)}
            onWatermarkChange={setWatermarkText}
            onAutoEnhance={handleAutoEnhance}
            onReset={handleReset}
            isEnhancing={isEnhancing}
          />
        </div>
      </div>
    </div>
  );
}
