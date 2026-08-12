import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-colors duration-150 select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-[color-mix(in_srgb,var(--accent)_88%,black)] focus-visible:outline-accent",
  secondary:
    "bg-card text-ink border border-line-strong hover:border-ink-3 hover:bg-card-2",
  ghost: "text-ink-2 hover:text-ink hover:bg-card-2",
  danger: "bg-red-700/90 text-white hover:bg-red-800",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs",
  sm: "h-8 px-3 text-[13px]",
  md: "h-9.5 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", icon, iconRight, className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
);
Button.displayName = "Button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = "ghost", size = "md", active, className = "", ...rest }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${
        size === "sm" ? "h-8 w-8" : "h-9.5 w-9.5"
      } ${
        active
          ? "text-accent bg-accent-soft"
          : variant === "secondary"
            ? "text-ink-2 hover:text-ink hover:bg-card-2"
            : "text-ink-2 hover:text-ink hover:bg-card-2"
      } ${className}`}
      {...rest}
    />
  )
);
IconButton.displayName = "IconButton";