"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Width preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdrop = true,
}: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#252B25]/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      {/* Card */}
      <div
        className={`relative bg-white w-full ${sizes[size]} rounded-xl border-2 border-[#D9D8CE] shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Olive header strip */}
        <div className="h-1 bg-[#556B3F]" />

        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-5 border-b border-[#D9D8CE] bg-[#F7F5EE]">
            <div>
              {title && (
                <h2 className="text-base font-black uppercase tracking-widest text-[#263229]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[#687066] font-medium mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 text-[#687066] hover:text-[#A94A3F] transition-colors p-1 rounded hover:bg-[#F0EEE7]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
