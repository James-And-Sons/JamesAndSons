import React from 'react';

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'light' | 'dark';
}

export function BrandLogo({ variant = 'light', alt, ...props }: BrandLogoProps) {
  const src = variant === 'light' ? '/images/logo-light.png' : '/images/logo-dark.png';
  return (
    <img
      src={src}
      alt={alt || "Brand Logo"}
      {...props}
    />
  );
}
