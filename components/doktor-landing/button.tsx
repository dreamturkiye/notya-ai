import React from "react";
import { cn } from "./cn";

const variants = {
  pine: "bg-pine text-cream hover:bg-pine-2",
  cream: "bg-cream text-ink hover:bg-paper",
  ink: "bg-ink text-cream hover:bg-ink-2",
  outline: "bg-transparent text-ink ring-1 ring-line hover:bg-paper-2",
} as const;

const sizes = {
  default: "h-11 rounded-full px-5",
  lg: "h-12 rounded-full px-6 text-base",
  sm: "h-9 rounded-full px-4 text-xs tracking-wide",
  icon: "size-11 rounded-full",
} as const;

export function Button({
  className,
  variant = "pine",
  size = "default",
  href,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-outfit text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine cursor-pointer",
    variants[variant],
    sizes[size],
    className,
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
