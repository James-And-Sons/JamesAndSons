"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface ProductZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
}

export default function ProductZoomModal({
  isOpen,
  onClose,
  images,
  activeIndex,
  onIndexChange,
  productName,
}: ProductZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const lastTapRef = useRef<number>(0);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchPanStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset zoom & pan when image changes or modal opens
  const resetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [activeIndex, isOpen, resetZoom]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "Right") {
        if (scale === 1 && activeIndex < images.length - 1) {
          onIndexChange(activeIndex + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        if (scale === 1 && activeIndex > 0) {
          onIndexChange(activeIndex - 1);
        }
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => Math.min(4, Number((s + 0.5).toFixed(1))));
      } else if (e.key === "-" || e.key === "_") {
        setScale((s) => {
          const next = Math.max(1, Number((s - 0.5).toFixed(1)));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    activeIndex,
    images.length,
    scale,
    onIndexChange,
    onClose,
    resetZoom,
  ]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[activeIndex];

  // Helper zoom functions
  const zoomIn = () => {
    setScale((s) => Math.min(4, Number((s + 0.5).toFixed(1))));
  };

  const zoomOut = () => {
    setScale((s) => {
      const next = Math.max(1, Number((s - 0.5).toFixed(1)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const toggleZoomAtPoint = (
    clientX: number,
    clientY: number,
    containerRect: DOMRect,
  ) => {
    if (scale > 1) {
      resetZoom();
    } else {
      const newScale = 2.5;
      // Calculate pan offset to focus on clicked/tapped point
      const offsetX =
        (containerRect.width / 2 - (clientX - containerRect.left)) *
        (newScale - 1);
      const offsetY =
        (containerRect.height / 2 - (clientY - containerRect.top)) *
        (newScale - 1);
      setScale(newScale);
      setPan({ x: offsetX, y: offsetY });
    }
  };

  // Mouse wheel zoom inside modal
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setScale((s) => {
      const next = Math.min(4, Math.max(1, Number((s + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse Drag / Pan Handling
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Gestures (Pinch-to-zoom, Double-tap, Single finger pan / swipe)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const containerRect = e.currentTarget.getBoundingClientRect();

    if (e.touches.length === 2) {
      // Two-finger Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Single finger gesture start (Check for double-tap or pan/swipe)
      const now = Date.now();
      const touch = e.touches[0];
      const timeDiff = now - lastTapRef.current;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected!
        toggleZoomAtPoint(touch.clientX, touch.clientY, containerRect);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        touchPanStartRef.current = {
          x: touch.clientX - pan.x,
          y: touch.clientY - pan.y,
        };
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinch to zoom scaling
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const factor = dist / touchStartDistRef.current;
      const newScale = Math.min(
        4,
        Math.max(1, Number((touchStartScaleRef.current * factor).toFixed(2))),
      );
      setScale(newScale);
      if (newScale === 1) setPan({ x: 0, y: 0 });
    } else if (
      e.touches.length === 1 &&
      scale > 1 &&
      touchPanStartRef.current
    ) {
      // Single finger pan when zoomed in
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - touchPanStartRef.current.x,
        y: touch.clientY - touchPanStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartDistRef.current = null;

    // Handle horizontal swipe when unzoomed (scale === 1)
    if (
      scale === 1 &&
      touchStartPosRef.current &&
      e.changedTouches.length === 1
    ) {
      const diffX = e.changedTouches[0].clientX - touchStartPosRef.current.x;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0 && activeIndex < images.length - 1) {
          onIndexChange(activeIndex + 1);
        } else if (diffX > 0 && activeIndex > 0) {
          onIndexChange(activeIndex - 1);
        }
      }
    }
    touchStartPosRef.current = null;
    touchPanStartRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white/90 font-mono text-xs tracking-wider">
          <span className="truncate max-w-[200px] sm:max-w-[300px]">
            {productName}
          </span>
          <span className="text-white/40">|</span>
          <span>
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
          aria-label="Close image viewer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Main Interactive Zoom Viewport */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            const containerRect = e.currentTarget.getBoundingClientRect();
            toggleZoomAtPoint(e.clientX, e.clientY, containerRect);
          }
        }}
      >
        <div
          className="relative w-full h-full max-w-[90vw] max-h-[80vh] transition-transform duration-100 ease-out flex items-center justify-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <Image
            src={currentImage}
            alt={`${productName} - Zoom view`}
            fill
            sizes="100vw"
            style={{ objectFit: "contain" }}
            priority
            draggable={false}
          />
        </div>

        {/* Left Arrow Navigation */}
        {images.length > 1 && activeIndex > 0 && scale === 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(activeIndex - 1);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 transition-all z-20 cursor-pointer"
            aria-label="Previous image"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow Navigation */}
        {images.length > 1 &&
          activeIndex < images.length - 1 &&
          scale === 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(activeIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 transition-all z-20 cursor-pointer"
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div
        className="w-full p-4 flex items-center justify-center z-10 bg-gradient-to-t from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-white/90 font-mono text-xs">
          {/* Zoom Out Button */}
          <button
            onClick={zoomOut}
            disabled={scale <= 1}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          {/* Scale Percentage Indicator & Reset Button */}
          <button
            onClick={resetZoom}
            className="px-3 py-1 rounded-full hover:bg-white/15 transition-colors font-mono text-[11px] tracking-wider cursor-pointer"
            title="Reset Zoom (0)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            onClick={zoomIn}
            disabled={scale >= 4}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
