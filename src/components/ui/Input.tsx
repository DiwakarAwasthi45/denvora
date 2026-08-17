import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: ReactNode;
  leftElement?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-11",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, rightElement, leftElement, size = "md", id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              sizes[size],
              leftElement ? "pl-9" : "",
              rightElement ? "pr-10" : "",
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
