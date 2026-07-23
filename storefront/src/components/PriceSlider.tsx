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
  // Bind values within bounds
  const effectiveMin = currentMin < min ? min : currentMin;
  const effectiveMax = currentMax > max ? max : currentMax;

  const [minVal, setMinVal] = useState(effectiveMin);
  const [maxVal, setMaxVal] = useState(effectiveMax);

  useEffect(() => {
    setMinVal(currentMin < min ? min : currentMin);
    setMaxVal(currentMax > max ? max : currentMax);
  }, [currentMin, currentMax, min, max]);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - 1000);
    setMinVal(val);
    onChange(val, maxVal);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + 1000);
    setMaxVal(val);
    onChange(minVal, val);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMinVal(val);
    if (val >= min && val < maxVal) {
      onChange(val, maxVal);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMaxVal(val);
    if (val <= max && val > minVal) {
      onChange(minVal, val);
    }
  };

  // Track percentage calculation
  const range = max - min || 1;
  const minPercent = Math.max(0, Math.min(100, ((minVal - min) / range) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxVal - min) / range) * 100));

  const isFiltered = minVal > min || maxVal < max;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Label + Range Text */}
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
          Price Filter
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--gold)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Reset Price ✕
          </button>
        )}
      </div>

      {/* Dual Range Track */}
      <div style={{ position: 'relative', width: '100%', height: '24px', display: 'flex', alignItems: 'center' }}>
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

        {/* Selected Range Active Bar */}
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

        {/* Lower Limit Handle Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={minVal}
          onChange={handleMinSliderChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            WebkitAppearance: 'none',
            background: 'none',
            pointerEvents: 'none',
            zIndex: 5,
          }}
          className="dual-range-input"
        />

        {/* Upper Limit Handle Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={maxVal}
          onChange={handleMaxSliderChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            WebkitAppearance: 'none',
            background: 'none',
            pointerEvents: 'none',
            zIndex: 6,
          }}
          className="dual-range-input"
        />
      </div>

      {/* Clean Min / Max Numeric Input Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            Min Price (₹)
          </label>
          <input
            type="number"
            min={min}
            max={maxVal - 1000}
            step={1000}
            value={minVal}
            onChange={handleMinInputChange}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}
          >
            Max Price (₹)
          </label>
          <input
            type="number"
            min={minVal + 1000}
            max={max}
            step={1000}
            value={maxVal}
            onChange={handleMaxInputChange}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Global CSS for Range Slider Thumbs */}
      <style jsx global>{`
        input[type='range'].dual-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--obsidian);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        input[type='range'].dual-range-input::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        input[type='range'].dual-range-input::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--gold);
          border: 2px solid var(--obsidian);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
