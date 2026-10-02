import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Small label above the title, uppercase military style */
  label?: string;
  className?: string;
}

export function PageHeader({ title, description, action, label, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {label && (
          <div className="text-[10px] font-black tracking-[0.2em] text-[#B69B63] uppercase mb-1">
            {label}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-black text-[#263229] tracking-tight uppercase">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-[#687066] font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 pt-1">{action}</div>}
    </div>
  );
}
