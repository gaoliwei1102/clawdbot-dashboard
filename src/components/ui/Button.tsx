import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/cn";

type ButtonVariant = "default" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium outline-none ring-offset-zinc-950 transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2";

const variants: Record<ButtonVariant, string> = {
  default: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
  secondary: "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800",
  ghost: "text-zinc-200 hover:bg-zinc-900",
  danger: "bg-red-500 text-zinc-950 hover:bg-red-400"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4"
};

export function Button({
  className,
  variant = "default",
  size = "md",
  asChild,
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
