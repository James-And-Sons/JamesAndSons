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
  className = "",
  onClick,
  ...props
}: HapticLinkProps) {
  return (
    <Link
      {...props}
      onClick={onClick}
      className={`transition-all duration-200 ease-out active:scale-[0.97] active:bg-[rgba(201,168,76,0.15)] active:border-[var(--gold)] ${className}`}
    >
      {children}
    </Link>
  );
}
