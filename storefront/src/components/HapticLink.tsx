"use client";
import Link, { LinkProps } from "next/link";
import { triggerHaptic } from "@/lib/haptic";

interface HapticLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function HapticLink({
  children,
  onClick,
  ...props
}: HapticLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    triggerHaptic(18);
    if (onClick) onClick(e);
  };

  return (
    <Link
      {...props}
      onClick={handleClick}
      onTouchStart={() => triggerHaptic(15)}
    >
      {children}
    </Link>
  );
}
