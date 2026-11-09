import { CURRENCIES } from './constants';
import { isDateStr, round2, uid } from './format';
import type { DB, Settings, Tx, TxKind } from './types';

const STORE_KEY = 'adminpay:v1';
const KINDS: TxKind[] = ['expense', 'income', 'save_in', 'save_out'];

export const defaultSettings = (): Settings => ({
  name: '',
  salary: 0,
  payday: 1,
  autoSalary: true,
  currency: 'USD',
  theme: 'dark',
  autoLock: 5,
  savingsGoal: 0,
});

export const defaultDB = (): DB => ({
  version: 1,
  pin: null,
  settings: defaultSettings(),
  tx: [],
  salaryMonths: [],
  lockUntil: 0,
});

function sanitizeSettings(raw: unknown): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<Settings>;
  return {
    name: typeof s.name === 'string' ? s.name.slice(0, 40) : base.name,
    salary: typeof s.salary === 'number' && s.salary >= 0 ? round2(s.salary) : base.salary,
    payday: typeof s.payday === 'number' && s.payday >= 1 && s.payday <= 31 ? Math.round(s.payday) : base.payday,
    autoSalary: typeof s.autoSalary === 'boolean' ? s.autoSalary : base.autoSalary,
    currency: CURRENCIES.some(([c]) => c === s.currency) ? (s.currency as string) : base.currency,
    theme: s.theme === 'light' || s.theme === 'dark' || s.theme === 'system' ? s.theme : base.theme,
    autoLock: typeof s.autoLock === 'number' && s.autoLock >= 0 ? s.autoLock : base.autoLock,
    savingsGoal: typeof s.savingsGoal === 'number' && s.savingsGoal >= 0 ? round2(s.savingsGoal) : base.savingsGoal,
  };
}

export function sanitizeTx(list: unknown): Tx[] {
  if (!Array.isArray(list)) return [];
  const out: Tx[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const t = raw as Partial<Tx>;
    if (!KINDS.includes(t.kind as TxKind)) continue;
    if (typeof t.amount !== 'number' || !(t.amount > 0) || !Number.isFinite(t.amount)) continue;
    if (!isDateStr(t.date)) continue;
    out.push({
      id: typeof t.id === 'string' && t.id ? t.id : uid(),
      kind: t.kind as TxKind,
      amount: round2(t.amount),
      category: typeof t.category === 'string' ? t.category : '',
      note: typeof t.note === 'string' ? t.note.slice(0, 80) : '',
      date: t.date,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
    });
  }
  return out;
}

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultDB();
    const d = JSON.parse(raw) as Partial<DB>;
    const pin = d.pin && typeof d.pin.hash === 'string' && typeof d.pin.salt === 'string' ? d.pin : null;
    return {
      version: 1,
      pin,
      settings: sanitizeSettings(d.settings),
      tx: sanitizeTx(d.tx),
      salaryMonths: Array.isArray(d.salaryMonths) ? d.salaryMonths.filter((m) => typeof m === 'string') : [],
      lockUntil: typeof d.lockUntil === 'number' ? d.lockUntil : 0,
    };
  } catch {
    return defaultDB();
  }
}

export function saveDB(db: DB): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

export function clearDB() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* sin acceso a almacenamiento */
  }
}

/** Respaldo sin el PIN: al importarlo se mantiene el PIN actual. */
export function exportBackup(db: DB): string {
  const { settings, tx, salaryMonths } = db;
  return JSON.stringify({ app: 'AdminPay', version: 1, exportedAt: new Date().toISOString(), settings, tx, salaryMonths }, null, 2);
}

export function parseBackup(text: string): Pick<DB, 'settings' | 'tx' | 'salaryMonths'> {
  const d = JSON.parse(text);
  if (!d || typeof d !== 'object' || !Array.isArray(d.tx)) throw new Error('El archivo no es un respaldo de AdminPay.');
  return {
    settings: sanitizeSettings(d.settings),
    tx: sanitizeTx(d.tx),
    salaryMonths: Array.isArray(d.salaryMonths) ? d.salaryMonths.filter((m: unknown) => typeof m === 'string') : [],
  };
}
