// Shared number formatters for the estimate flow. Single source of truth so the
// dashboard, the count-up, and the money-flow visualization all render figures
// identically (e.g. "$1.9M", "140K").

/** Compact integer formatting: 1_900_000 → "1.9M", 140_000 → "140K". */
export function fmtInt(n: number): string {
  if (n >= 1e9) return `${parseFloat((n / 1e9).toFixed(2))}B`;
  if (n >= 1e6) return `${parseFloat((n / 1e6).toFixed(2))}M`;
  if (n >= 1e3) return `${parseFloat((n / 1e3).toFixed(1))}K`;
  return Math.round(n).toLocaleString();
}

/** Compact USD: 2250 → "$2.3K". */
export function usd(value: number): string {
  return `$${fmtInt(value)}`;
}
