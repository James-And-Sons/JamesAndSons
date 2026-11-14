"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  required,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full font-sans text-[13px]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background border border-border px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-accent transition-colors flex items-center justify-between cursor-pointer rounded-sm"
      >
        <span className={selectedOption ? "text-primary" : "text-muted/60"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="bg-surface border border-border shadow-xl z-[9999] max-h-60 overflow-y-auto rounded-sm py-1 font-sans text-[13px]"
          >
            {placeholder && !required && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-surface-muted hover:text-primary transition-colors text-muted/60 text-[13px] cursor-pointer"
              >
                {placeholder}
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors text-[13px] flex items-center justify-between cursor-pointer ${
                  opt.value === value
                    ? "bg-surface-muted text-accent font-semibold"
                    : "text-secondary"
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span>✓</span>}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
