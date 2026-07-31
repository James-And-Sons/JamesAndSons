"use client";
import React, { useState, useEffect } from "react";

export interface AdaptiveImageFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: number | string; // e.g. 1, 4/5, 0.8, '1/1', 'auto'
  fallbackAspectRatio?: number | string; // default fallback while loading
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function AdaptiveImageFrame({
  src,
  alt,
  aspectRatio: preferredAspectRatio,
  fallbackAspectRatio = "4/5",
  objectFit = "cover",
  priority = false,
  sizes,
  children,
  className = "",
  style = {},
  imgClassName = "",
  imgStyle = {},
  onLoad,
  ...rest
}: AdaptiveImageFrameProps) {
  const [detectedRatio, setDetectedRatio] = useState<number | string | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Parse or compute actual aspect ratio style string
  let currentAspectRatio: string | number = fallbackAspectRatio;
  if (preferredAspectRatio && preferredAspectRatio !== "auto") {
    currentAspectRatio = preferredAspectRatio;
  } else if (detectedRatio) {
    currentAspectRatio = detectedRatio;
  }

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setDetectedRatio(ratio);
    }
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  return (
    <div
      className={`adaptive-image-frame ${className}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio:
          typeof currentAspectRatio === "number"
            ? `${currentAspectRatio}`
            : currentAspectRatio,
        overflow: "hidden",
        transition:
          "aspect-ratio 0.35s ease-in-out, background-color 0.3s ease",
        ...style,
      }}
      {...rest}
    >
      {/* Shimmer loading placeholder */}
      {!isLoaded && (
        <div
          className="adaptive-image-shimmer"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
            backgroundSize: "200% 100%",
            animation: "adaptiveShimmer 1.5s infinite linear",
            zIndex: 1,
          }}
        />
      )}

      {/* Render HTML Image with fallback and smooth opacity transition */}
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          className={`adaptive-image-element ${imgClassName}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.35s ease-in-out",
            zIndex: 2,
            ...imgStyle,
          }}
        />
      )}

      {children}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes adaptiveShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `,
        }}
      />
    </div>
  );
}
