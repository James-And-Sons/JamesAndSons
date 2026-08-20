"use client";

import React from "react";
import {
  RotateCw,
  Sun,
  Contrast,
  Sliders,
  Crop,
  Wand2,
  RefreshCw,
} from "lucide-react";

interface ImageToolbarProps {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  aspectRatio: string;
  whiteBg: boolean;
  watermarkText: string;
  onBrightnessChange: (val: number) => void;
  onContrastChange: (val: number) => void;
  onSaturationChange: (val: number) => void;
  onRotate: () => void;
  onAspectRatioChange: (val: string) => void;
  onWhiteBgToggle: () => void;
  onWatermarkChange: (val: string) => void;
  onAutoEnhance: () => void;
  onReset: () => void;
  isEnhancing: boolean;
}

export default function ImageToolbar({
  brightness,
  contrast,
  saturation,
  rotation,
  aspectRatio,
  whiteBg,
  watermarkText,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onRotate,
  onAspectRatioChange,
  onWhiteBgToggle,
  onWatermarkChange,
  onAutoEnhance,
  onReset,
  isEnhancing,
}: ImageToolbarProps) {
  return (
    <div className="w-80 bg-surface border-l border-border p-4 space-y-5 overflow-y-auto">
      {/* Auto-Enhance Button */}
      <div className="flex gap-2">
        <button
          onClick={onAutoEnhance}
          disabled={isEnhancing}
          className="flex-1 py-2 px-3 bg-gold text-obsidian font-semibold rounded text-xs hover:brightness-110 flex items-center justify-center gap-1.5 transition-all"
        >
          <Wand2 size={14} />
          <span>{isEnhancing ? "Analyzing..." : "Auto Enhance"}</span>
        </button>
        <button
          onClick={onReset}
          className="p-2 border border-border rounded text-textMuted hover:text-text hover:bg-surface2 text-xs"
          title="Reset Transformations"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Adjustments */}
      <div className="space-y-3">
        <div className="text-xs uppercase font-mono tracking-wider text-gold font-bold">
          Adjustments
        </div>

        <div>
          <div className="flex justify-between text-xs text-textMuted mb-1">
            <span className="flex items-center gap-1">
              <Sun size={12} /> Brightness
            </span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-textMuted mb-1">
            <span className="flex items-center gap-1">
              <Contrast size={12} /> Contrast
            </span>
            <span>{contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={contrast}
            onChange={(e) => onContrastChange(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-textMuted mb-1">
            <span className="flex items-center gap-1">
              <Sliders size={12} /> Saturation
            </span>
            <span>{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => onSaturationChange(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
      </div>

      {/* Crop & Transform */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="text-xs uppercase font-mono tracking-wider text-gold font-bold">
          Transform & Aspect Ratio
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRotate}
            className="flex-1 py-1.5 px-3 bg-surface2 border border-border rounded text-xs text-text flex items-center justify-center gap-1 hover:border-gold"
          >
            <RotateCw size={12} />
            <span>Rotate 90°</span>
          </button>
        </div>

        <div>
          <label className="block text-xs text-textMuted mb-1">
            Aspect Ratio Preset
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
          >
            <option value="original">Original Aspect Ratio</option>
            <option value="1:1">1:1 Square (Amazon & Meta)</option>
            <option value="4:3">4:3 Standard Catalog</option>
            <option value="16:9">16:9 Landscape Banner</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-text cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={whiteBg}
            onChange={onWhiteBgToggle}
            className="accent-gold w-4 h-4"
          />
          <span>Solid White Background (#FFFFFF)</span>
        </label>
      </div>

      {/* Watermark Overlay */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <div className="text-xs uppercase font-mono tracking-wider text-gold font-bold">
          Watermark Text
        </div>
        <input
          type="text"
          placeholder="e.g. Official Studio Spec"
          value={watermarkText}
          onChange={(e) => onWatermarkChange(e.target.value)}
          className="w-full px-3 py-1.5 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold"
        />
      </div>
    </div>
  );
}
