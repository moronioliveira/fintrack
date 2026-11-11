const UNITS = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function upTo999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest < 20) {
    if (rest) parts.push(UNITS[rest]);
  } else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    parts.push(u ? `${TENS[t]} e ${UNITS[u]}` : TENS[t]);
  }
  return parts.join(" e ");
}

const SCALES: [string, string][] = [["", ""], ["mil", "mil"], ["milhão", "milhões"], ["bilhão", "bilhões"]];

function integerToWords(n: number): string {
  if (n === 0) return "zero";
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    const [singular, plural] = SCALES[i];
    let chunk = i === 1 && g === 1 ? "" : upTo999(g);
    if (i > 0) chunk = `${chunk} ${g === 1 ? singular : plural}`.trim();
    words.push(chunk);
  }
  // "e" antes do último grupo quando ele é < 100 ou centena exata (ex.: "mil e duzentos").
  const last = groups[0];
  if (words.length > 1 && last && (last < 100 || last % 100 === 0)) {
    const tail = words.pop()!;
    return `${words.join(" ")} e ${tail}`;
  }
  return words.join(" ");
}

/** Valor monetário por extenso (ex.: 1.250,30 → "mil, duzentos e cinquenta reais e trinta centavos"). */
export function moneyInWords(value: number, currency = "BRL") {
  const names: Record<string, [string, string]> = { BRL: ["real", "reais"], USD: ["dólar", "dólares"], EUR: ["euro", "euros"] };
  const [one, many] = names[currency] ?? names.BRL;
  const cents = Math.round(Math.abs(value) * 100);
  const int = Math.floor(cents / 100);
  const frac = cents % 100;
  const parts: string[] = [];
  if (int) {
    const w = integerToWords(int);
    const needsDe = int >= 1_000_000 && int % 1_000_000 === 0;
    parts.push(`${w}${needsDe ? " de" : ""} ${int === 1 ? one : many}`);
  }
  if (frac) parts.push(`${integerToWords(frac)} ${frac === 1 ? "centavo" : "centavos"}`);
  return parts.length ? parts.join(" e ") : `zero ${many}`;
}
