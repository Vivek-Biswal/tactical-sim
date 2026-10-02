import React from "react";

export type StatusVariant = "NORMAL" | "DEGRADED" | "OFFLINE" | "ACTIVE" | "READY" | "PENDING" | "ARCHIVED";

interface StatusBadgeProps {
  status: StatusVariant;
  showDot?: boolean;
  className?: string;
  label?: string;
}

const variants: Record<StatusVariant, { bg: string; text: string; dot: string; label: string }> = {
  NORMAL:   { bg: "bg-[#EBF4E8]", text: "text-[#3A6B30]", dot: "bg-[#4A7A3A]", label: "NORMAL" },
  ACTIVE:   { bg: "bg-[#EBF4E8]", text: "text-[#3A6B30]", dot: "bg-[#4A7A3A]", label: "ACTIVE" },
  READY:    { bg: "bg-[#EEF3E8]", text: "text-[#556B3F]", dot: "bg-[#556B3F]", label: "READY" },
  DEGRADED: { bg: "bg-[#FDF3E3]", text: "text-[#8A5C2A]", dot: "bg-[#B87A3A]", label: "DEGRADED" },
  PENDING:  { bg: "bg-[#F5F1E8]", text: "text-[#7A6B4A]", dot: "bg-[#B69B63]", label: "PENDING" },
  OFFLINE:  { bg: "bg-[#FAF0EF]", text: "text-[#A94A3F]", dot: "bg-[#A94A3F]", label: "OFFLINE" },
  ARCHIVED: { bg: "bg-[#EFE8D8]", text: "text-[#687066]", dot: "bg-[#A0A59E]", label: "ARCHIVED" },
};

export function StatusBadge({ status, showDot = true, className = "", label }: StatusBadgeProps) {
  const v = variants[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest border border-black/5 ${v.bg} ${v.text} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${v.dot}`} />}
      {label || v.label}
    </span>
  );
}
