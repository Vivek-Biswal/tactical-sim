import React from "react";

interface PanelCardProps {
  children: React.ReactNode;
  className?: string;
  /** Coloured top accent strip */
  accent?: "olive" | "brass" | "red" | "none";
  /** Remove default padding */
  noPadding?: boolean;
  /** Optional card header rendered inside the card */
  header?: React.ReactNode;
}

const accents = {
  olive: "border-t-[#556B3F]",
  brass: "border-t-[#B69B63]",
  red:   "border-t-[#A94A3F]",
  none:  "",
};

export function PanelCard({
  children,
  className = "",
  accent = "none",
  noPadding = false,
  header,
}: PanelCardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-[#D9D8CE] shadow-sm
        ${accent !== "none" ? `border-t-4 ${accents[accent]}` : ""}
        ${className}
      `}
    >
      {header && (
        <div className="px-6 py-4 border-b border-[#D9D8CE] bg-[#F7F5EE] rounded-t-xl">
          {header}
        </div>
      )}
      {!noPadding && <div className="p-6">{children}</div>}
      {noPadding && children}
    </div>
  );
}
