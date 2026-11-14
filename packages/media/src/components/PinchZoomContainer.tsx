"use client";
import React, { useState, useRef } from "react";

export interface PinchZoomContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxScale?: number;
  minScale?: number;
  className?: string;
  style?: React.CSSProperties;
  onZoomChange?: (isZoomed: boolean) => void;
}

export function PinchZoomContainer({
  children,
  maxScale = 4,
  minScale = 1,
  className = "",
  style = {},
  onZoomChange,
  ...rest
}: PinchZoomContainerProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const startDistRef = useRef<number | null>(null);
  const startScaleRef = useRef<number>(1);
  const startCenterRef = useRef<{ x: number; y: number } | null>(null);
  const startTranslateRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);
      startDistRef.current = dist;
      startScaleRef.current = scale;
      startCenterRef.current = center;
      startTranslateRef.current = translate;
      setIsPinching(true);
      if (onZoomChange) onZoomChange(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      e.touches.length === 2 &&
      startDistRef.current !== null &&
      startCenterRef.current !== null
    ) {
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getCenter(e.touches[0], e.touches[1]);

      const newScale = Math.min(
        Math.max(
          minScale,
          (currentDist / startDistRef.current) * startScaleRef.current,
        ),
        maxScale,
      );

      const deltaX = currentCenter.x - startCenterRef.current.x;
      const deltaY = currentCenter.y - startCenterRef.current.y;

      const newTranslateX = startTranslateRef.current.x + deltaX;
      const newTranslateY = startTranslateRef.current.y + deltaY;

      setScale(newScale);
      setTranslate({ x: newTranslateX, y: newTranslateY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2 && isPinching) {
      setIsPinching(false);
      startDistRef.current = null;
      startCenterRef.current = null;
      // Instagram style snap-back to 1x scale
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      if (onZoomChange) onZoomChange(false);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`pinch-zoom-container ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        touchAction: isPinching ? "none" : "pan-x pan-y",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
          transition: isPinching
            ? "none"
            : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
