import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-20 px-6 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-xl bg-[#F0EEE7] border border-[#D9D8CE] flex items-center justify-center mb-6 text-[#71805A]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-black uppercase tracking-widest text-[#344438] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#687066] font-medium max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
