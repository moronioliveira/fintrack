const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: number, currency = "BRL", options?: { compact?: boolean; signed?: boolean }) {
  const key = `${currency}-${options?.compact ? "c" : "n"}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      notation: options?.compact ? "compact" : "standard",
      maximumFractionDigits: options?.compact ? 1 : 2,
    });
    formatters.set(key, formatter);
  }
  const formatted = formatter.format(Math.abs(value) < 0.005 ? 0 : value);
  return options?.signed && value > 0 ? `+${formatted}` : formatted;
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

/** Converte "1.234,56", "1.500", "1234.56" ou "-R$ 10,00" em número. */
export function parseMoney(input: string) {
  let v = input.replace(/[^\d,.-]/g, "");
  if (!v) return NaN;
  const lastComma = v.lastIndexOf(",");
  const lastDot = v.lastIndexOf(".");
  if (lastComma > lastDot) v = v.replace(/\./g, "").replace(",", ".");
  else if (lastComma < 0 && /^-?\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ""); // "1.500" = mil e quinhentos
  else v = v.replace(/,/g, "");
  return Number(v);
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
