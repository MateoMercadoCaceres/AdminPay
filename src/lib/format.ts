const LOCALE = 'es-419';

export const pad = (n: number) => String(n).padStart(2, '0');

const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDateStr(new Date());
export const monthOf = (date: string) => date.slice(0, 7);
export const currentMonth = () => monthOf(todayStr());
export const isDateStr = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftMonth(m: string, delta: number): string {
  const d = parseDate(`${m}-01`);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function daysInMonth(m: string): number {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo, 0).getDate();
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const monthLabel = (m: string) =>
  cap(new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(parseDate(`${m}-01`)));

export const shortMonthLabel = (m: string) =>
  cap(new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' }).format(parseDate(`${m}-01`)));

export function dayLabel(s: string): string {
  if (s === todayStr()) return 'Hoy';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (s === toDateStr(y)) return 'Ayer';
  return cap(new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(s)));
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Acepta "1500", "1,500.50", "1.500,50", "12,5"… */
export function parseAmount(input: string | number): number {
  let s = String(input).trim().replace(/\s/g, '');
  if (!s) return NaN;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (hasComma) {
    const parts = s.split(',');
    s = parts.length === 2 && parts[1].length <= 2 ? parts.join('.') : parts.join('');
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? round2(n) : NaN;
}

const fmtCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(n: number, currency: string): string {
  const v = round2(n) || 0; // evita "-0"
  const frac = Number.isInteger(v) ? 0 : 2;
  const key = `${currency}:${frac}`;
  let f = fmtCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: frac,
        maximumFractionDigits: frac,
      });
    } catch {
      f = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: frac, maximumFractionDigits: frac });
    }
    fmtCache.set(key, f);
  }
  return f.format(v);
}

export function currencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat(LOCALE, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    );
  } catch {
    return '$';
  }
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
