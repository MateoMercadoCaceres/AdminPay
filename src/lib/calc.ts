import { EXPENSE_CATS, INCOME_CATS, SAVING_META } from './constants';
import { currentMonth, daysInMonth, monthOf, pad, round2, uid } from './format';
import type { Category, DB, Tx } from './types';

const FALLBACK: Category = { id: 'otro', label: 'Otro', emoji: '💸', color: '#8d94a8' };

export function catMeta(t: Pick<Tx, 'kind' | 'category'>): Category {
  if (t.kind === 'expense') return EXPENSE_CATS.find((c) => c.id === t.category) ?? FALLBACK;
  if (t.kind === 'income') return INCOME_CATS.find((c) => c.id === t.category) ?? INCOME_CATS[INCOME_CATS.length - 1];
  return SAVING_META[t.kind];
}

export const isSaving = (t: Tx) => t.kind === 'save_in' || t.kind === 'save_out';

/** Efecto de un movimiento sobre el dinero disponible (cuenta principal). */
function mainEffect(t: Tx): number {
  switch (t.kind) {
    case 'income':
    case 'save_out':
      return t.amount;
    case 'expense':
    case 'save_in':
      return -t.amount;
  }
}

export function balances(tx: Tx[], excludeId?: string) {
  let available = 0;
  let savings = 0;
  for (const t of tx) {
    if (t.id === excludeId) continue;
    available += mainEffect(t);
    if (t.kind === 'save_in') savings += t.amount;
    else if (t.kind === 'save_out') savings -= t.amount;
  }
  return { available: round2(available), savings: round2(savings) };
}

export interface MonthTotals {
  income: number;
  salary: number;
  extra: number;
  expense: number;
  saveIn: number;
  saveOut: number;
  /** Lo que te sobró: ingresos − gastos */
  net: number;
  byCat: Record<string, number>;
  count: number;
}

export function monthTotals(tx: Tx[], m: string): MonthTotals {
  const r: MonthTotals = { income: 0, salary: 0, extra: 0, expense: 0, saveIn: 0, saveOut: 0, net: 0, byCat: {}, count: 0 };
  for (const t of tx) {
    if (monthOf(t.date) !== m) continue;
    r.count++;
    if (t.kind === 'income') {
      r.income += t.amount;
      if (t.category === 'sueldo') r.salary += t.amount;
      else r.extra += t.amount;
    } else if (t.kind === 'expense') {
      r.expense += t.amount;
      r.byCat[t.category] = (r.byCat[t.category] ?? 0) + t.amount;
    } else if (t.kind === 'save_in') r.saveIn += t.amount;
    else r.saveOut += t.amount;
  }
  r.net = round2(r.income - r.expense);
  return r;
}

export interface HistoryRow extends MonthTotals {
  month: string;
  /** Disponible acumulado al cierre del mes */
  available: number;
  /** Saldo de la cuenta de ahorro al cierre del mes */
  savings: number;
}

/** Resumen mes a mes con saldos acumulados (del más reciente al más antiguo). */
export function history(tx: Tx[]): HistoryRow[] {
  const months = new Set(tx.map((t) => monthOf(t.date)));
  months.add(currentMonth());
  let available = 0;
  let savings = 0;
  const rows: HistoryRow[] = [];
  for (const month of [...months].sort()) {
    const t = monthTotals(tx, month);
    available += t.income - t.expense - t.saveIn + t.saveOut;
    savings += t.saveIn - t.saveOut;
    rows.push({ ...t, month, available: round2(available), savings: round2(savings) });
  }
  return rows.reverse();
}

export const sortTx = (list: Tx[]) =>
  [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

/**
 * Registra el sueldo del mes actual si está activado, ya pasó el día de pago
 * y todavía no se registró (ni automática ni manualmente).
 */
export function withAutoSalary(db: DB): { db: DB; added: Tx | null } {
  const s = db.settings;
  const m = currentMonth();
  if (!s.autoSalary || !(s.salary > 0) || db.salaryMonths.includes(m)) return { db, added: null };

  const already = db.tx.some((t) => t.kind === 'income' && t.category === 'sueldo' && monthOf(t.date) === m);
  if (already) return { db: { ...db, salaryMonths: [...db.salaryMonths, m] }, added: null };

  const payday = Math.min(Math.max(1, s.payday || 1), daysInMonth(m));
  if (new Date().getDate() < payday) return { db, added: null };

  const added: Tx = {
    id: uid(),
    kind: 'income',
    category: 'sueldo',
    amount: s.salary,
    note: 'Sueldo mensual',
    date: `${m}-${pad(payday)}`,
    createdAt: Date.now(),
  };
  return { db: { ...db, tx: [...db.tx, added], salaryMonths: [...db.salaryMonths, m] }, added };
}
