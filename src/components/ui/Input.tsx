import * as React from "react";
import { cn } from "@/lib/utils";

// Tipos de input "de texto" que aceitam maxLength e ganham um teto padrão.
const TEXT_LIKE = new Set([
  "text",
  "search",
  "tel",
  "url",
  "email",
  "password",
]);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Use BOOST for execution screens (peso/reps); default otherwise. */
  inputSize?: "default" | "boost";
  /**
   * Filtro/máscara aplicado a cada digitação (ex.: maskPhoneBR, maskDecimal).
   * Impede digitar mais caracteres ou tipos diferentes do permitido: o valor
   * é normalizado antes de chegar ao onChange do consumidor.
   */
  mask?: (raw: string) => string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, inputSize = "default", type = "text", mask, maxLength, onChange, ...props },
    ref,
  ) => {
    // Teto padrão para todo campo de texto sem limite explícito (e-mail 50,
    // demais 120) - garante que nenhum campo aceite entrada ilimitada.
    const resolvedMaxLength =
      maxLength ??
      (type === "email" ? 50 : TEXT_LIKE.has(type) ? 120 : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (mask) {
        const masked = mask(e.target.value);
        if (masked !== e.target.value) e.target.value = masked;
      }
      onChange?.(e);
    };

    return (
      <input
        ref={ref}
        type={type}
        maxLength={resolvedMaxLength}
        onChange={handleChange}
        className={cn(
          "w-full min-w-0 box-border bg-bg-surface text-text-primary placeholder:text-text-muted border border-border-subtle rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.18)] transition-[background-color,border-color,box-shadow,color] duration-200 ease-out hover:border-border-strong hover:bg-bg-elevated/60 focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-glow focus:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed",
          inputSize === "default" &&
            "min-h-[48px] px-3.5 py-3 text-body-lg",
          inputSize === "boost" &&
            "min-h-[64px] px-4 py-4 text-center text-[28px] font-bold tnum",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLength, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        maxLength={maxLength ?? 2000}
        className={cn(
          "w-full min-h-[96px] bg-bg-surface text-text-primary placeholder:text-text-muted border border-border-subtle rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.18)] px-3.5 py-3 text-body-lg transition-[background-color,border-color,box-shadow,color] duration-200 ease-out hover:border-border-strong hover:bg-bg-elevated/60 focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-glow focus:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-caption font-semibold text-text-secondary mb-1.5",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-caption text-text-muted">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-caption text-error">{error}</p>}
    </div>
  );
}
