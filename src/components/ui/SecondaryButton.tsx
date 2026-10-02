import React from "react";

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-sm",
};

export function SecondaryButton({
  children,
  icon,
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...rest
}: SecondaryButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        bg-white hover:bg-[#F7F5EE] active:scale-[0.99]
        text-[#344438] font-black tracking-widest rounded-lg
        border border-[#D9D8CE] hover:border-[#556B3F]
        shadow-sm hover:shadow-md
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
