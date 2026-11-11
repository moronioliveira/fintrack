import { ValidationError } from "./action";
import { isValidISODate } from "./dates";
import { parseMoney, round2 } from "./format";

/** Helpers de leitura/validação de FormData para Server Actions. */
export function str(form: FormData, key: string, opts?: { required?: string; max?: number }) {
  const value = String(form.get(key) ?? "").trim();
  if (opts?.required && !value) throw new ValidationError(opts.required);
  if (opts?.max && value.length > opts.max) throw new ValidationError(`Campo muito longo (máx. ${opts.max} caracteres).`);
  return value;
}

export function optStr(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value || null;
}

export function money(form: FormData, key: string, opts?: { allowZero?: boolean; allowNegative?: boolean; label?: string }) {
  const raw = String(form.get(key) ?? "");
  const value = parseMoney(raw);
  const label = opts?.label ?? "Valor";
  if (!Number.isFinite(value)) throw new ValidationError(`${label} inválido.`);
  if (!opts?.allowNegative && value < 0) throw new ValidationError(`${label} não pode ser negativo.`);
  if (!opts?.allowZero && value === 0) throw new ValidationError(`${label} deve ser maior que zero.`);
  if (Math.abs(value) > 999_999_999_999) throw new ValidationError(`${label} muito alto.`);
  return round2(value);
}

export function date(form: FormData, key: string, opts?: { required?: boolean }) {
  const value = String(form.get(key) ?? "").trim();
  if (!value) {
    if (opts?.required) throw new ValidationError("Informe a data.");
    return null;
  }
  if (!isValidISODate(value)) throw new ValidationError("Data inválida.");
  return value;
}

export function oneOf<T extends string>(form: FormData, key: string, options: readonly T[], fallback?: T): T {
  const value = String(form.get(key) ?? "") as T;
  if (options.includes(value)) return value;
  if (fallback !== undefined) return fallback;
  throw new ValidationError("Opção inválida.");
}

export function int(form: FormData, key: string, min: number, max: number, fallback: number) {
  const value = Number.parseInt(String(form.get(key) ?? ""), 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

export function bool(form: FormData, key: string) {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}
