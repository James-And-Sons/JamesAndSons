"use client";

import React from "react";
import { useTenantConfig } from "./TenantProvider";

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "light" | "dark";
}

export function BrandLogo({
  variant = "light",
  alt,
  className,
  ...props
}: BrandLogoProps) {
  const config = useTenantConfig();
  const logoSrc =
    variant === "light"
      ? config.assets.logoLight || "/images/logo-light.png"
      : config.assets.logoDark || "/images/logo-dark.png";
  const brandName = config.brand.name || "Brand Logo";

  return (
    <img
      src={logoSrc}
      alt={alt || brandName}
      className={className}
      {...props}
    />
  );
}
