export type TxKind = 'expense' | 'income' | 'save_in' | 'save_out';

export interface Tx {
  id: string;
  kind: TxKind;
  amount: number;
  category: string;
  note: string;
  /** Fecha local en formato YYYY-MM-DD */
  date: string;
  createdAt: number;
}

export type ThemePref = 'dark' | 'light' | 'system';

export interface Settings {
  name: string;
  salary: number;
  payday: number;
  autoSalary: boolean;
  currency: string;
  theme: ThemePref;
  /** Minutos de inactividad antes de bloquear; 0 = nunca */
  autoLock: number;
  savingsGoal: number;
}

export interface PinData {
  salt: string;
  hash: string;
  algo: 'sha256' | 'fnv';
}

export interface DB {
  version: 1;
  pin: PinData | null;
  settings: Settings;
  tx: Tx[];
  /** Meses (YYYY-MM) en los que ya se registró el sueldo automático */
  salaryMonths: string[];
  lockUntil: number;
}

export type View = 'home' | 'movements' | 'savings' | 'settings';

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
}
