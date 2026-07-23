'use client';
import React, { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

type PriceSliderProps = {
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  onReset: () => void;
};

export default function PriceSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
  onReset,
}: PriceSliderProps) {
  // Effective values bound to range
  const safeMin = Math.max(min, currentMin);
  const safeMax = currentMax > max ? max : currentMax;

  const [minVal, setMinVal] = useState(safeMin);
  const [maxVal, setMaxVal] = useState(safeMax);

  useEffect(() => {
    setMinVal(currentMin < min ? min : currentMin);
    setMaxVal(currentMax > max ? max : currentMax);
  }, [currentMin, currentMax, min, max]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 1000);
    setMinVal(value);
    onChange(value, maxVal);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 1000);
    setMaxVal(value);
    onChange(minVal, value);
  };

  // Calculate percentage positions for track fill
  const minPercent = Math.max(0, Math.min(100, Math.round(((minVal - min) / (max - min || 1)) * 100)));
  const maxPercent = Math.max(0, Math.min(100, Math.round(((maxVal - min) / (max - min || 1)) * 100)));

  const isFiltered = minVal > min || maxVal < max;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Header Label + Value Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Price Range
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--gold-light)',
            fontWeight: 600,
          }}
        >
          {formatPrice(minVal)} — {maxVal >= max ? `${formatPrice(max)}+` : formatPrice(maxVal)}
        </span>
      </div>

      {/* Range Slider Track & Inputs */}
      <div style={{ position: 'relative', width: '100%', height: '32px', display: 'flex', alignItems: 'center' }}>
        {/* Background Track */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--surface2)',
            zIndex: 1,
          }}
        />

        {/* Highlighted Gold Track */}
        <div
          style={{
            position: 'absolute',
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
            height: '4px',
            borderRadius: '2px',
            background: 'var(--gold)',
            zIndex: 2,
          }}
        />

        {/* Min Input Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={minVal}
          onChange={handleMinChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            WebkitAppearance: 'none',
            background: 'none',
            pointerEvents: 'auto',
            zIndex: minVal > max - 100 ? 5 : 3,
            cursor: 'pointer',
          }}
          className="price-slider-thumb"
        />

        {/* Max Input Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={maxVal}
          onChange={handleMaxChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            WebkitAppearance: 'none',
            background: 'none',
            pointerEvents: 'auto',
            zIndex: 4,
            cursor: 'pointer',
          }}
          className="price-slider-thumb"
        />
      </div>

      {/* Preset Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
        {[
          { label: '< ₹25K', minP: min, maxP: 25000 },
          { label: '₹25K–₹75K', minP: 25000, maxP: 75000 },
          { label: '₹75K–₹150K', minP: 75000, maxP: 150000 },
          { label: '₹150K+', minP: 150000, maxP: max },
        ].map((preset) => {
          const isActive = minVal === preset.minP && maxVal === preset.maxP;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                if (isActive) {
                  onReset();
                } else {
                  onChange(preset.minP, preset.maxP);
                }
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '3px',
                border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: isActive ? 'var(--gold-light)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {preset.label}
            </button>
          );
        })}

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              border: 'none',
              background: 'none',
              color: 'var(--gold)',
              cursor: 'pointer',
            }}
          >
            Reset ✕
          </button>
        )}
      </div>

      {/* Embedded CSS for custom thumb rendering */}
      <style jsx global>{`
        input[type='range'].price-slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--obsidian);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        input[type='range'].price-slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type='range'].price-slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--obsidian);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
