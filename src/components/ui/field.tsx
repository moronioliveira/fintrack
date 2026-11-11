import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const width = (className: string) => (/(^|\s)(sm:|md:|lg:)?w-/.test(className) ? "" : "w-full");

const control =
  "rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-60";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${control} ${width(className)} h-10 ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${control} ${width(className)} h-10 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-8 ${className}`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${control} w-full min-h-20 py-2 ${className}`} {...props} />;
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

const SYMBOLS: Record<string, string> = { BRL: "R$", USD: "US$", EUR: "€" };

export function MoneyInput({ currency = "BRL", ...props }: InputHTMLAttributes<HTMLInputElement> & { currency?: string }) {
  const symbol = SYMBOLS[currency] ?? currency;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">{symbol}</span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0,00" className={`tabular ${symbol.length > 2 ? "pl-11" : "pl-9"}`} {...props} />
    </div>
  );
}
