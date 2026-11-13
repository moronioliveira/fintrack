// Datas "puras" (sem horário) são tratadas como strings ISO `YYYY-MM-DD` e
// convertidas para Date em UTC à meia-noite, compatível com colunas @db.Date.

export const APP_TIMEZONE = "America/Sao_Paulo";

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}

export function currentMonth() {
  return todayISO().slice(0, 7);
}

export function toDate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = toDate(value);
  // O JavaScript "rola" datas impossíveis (31/02 vira 03/03); só aceita se a data voltar idêntica.
  return !Number.isNaN(date.getTime()) && toISO(date) === value;
}

export function isValidMonth(value: string | undefined | null): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function daysInMonth(year: number, month1: number) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Soma meses mantendo o dia (limitado ao último dia do mês). */
export function addMonths(iso: string, months: number, preferredDay?: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month1 = (total % 12) + 1;
  const day = Math.min(preferredDay ?? d, daysInMonth(year, month1));
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

export function shiftMonth(month: string, delta: number) {
  return addMonths(`${month}-01`, delta).slice(0, 7);
}

/** Intervalo [início, fim) do mês como Date UTC. */
export function monthRange(month: string) {
  return { gte: toDate(`${month}-01`), lt: toDate(`${shiftMonth(month, 1)}-01`) };
}

export function lastDayOfMonth(month: string) {
  return addDays(`${shiftMonth(month, 1)}-01`, -1);
}

export function diffInDays(fromISO: string, toISOValue: string) {
  return Math.round((toDate(toISOValue).getTime() - toDate(fromISO).getTime()) / 86_400_000);
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

export function formatMonth(month: string) {
  const label = monthFormatter.format(toDate(`${month}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatShortMonth(month: string) {
  return shortMonthFormatter.format(toDate(`${month}-01`)).replace(".", "");
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(typeof value === "string" ? toDate(value) : value);
}

export function formatDayMonth(value: Date | string) {
  return dayMonthFormatter.format(typeof value === "string" ? toDate(value) : value).replace(".", "");
}

/** Aceita `YYYY-MM-DD` ou `DD/MM/YYYY` (formato comum em extratos brasileiros). */
export function parseFlexibleDate(value: string) {
  const v = value.trim();
  if (isValidISODate(v)) return v;
  const match = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const year = y.length === 2 ? `20${y}` : y;
  const iso = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return isValidISODate(iso) ? iso : null;
}
