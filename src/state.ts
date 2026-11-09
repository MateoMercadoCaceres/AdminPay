import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { DB, Settings, Tx, View } from './lib/types';

export type ModalState =
  | { type: 'tx'; kind?: 'expense' | 'income'; tx?: Tx; preset?: Partial<Tx> }
  | { type: 'savings'; dir?: 'in' | 'out'; tx?: Tx }
  | { type: 'goal' }
  | { type: 'pin' }
  | { type: 'onboarding' }
  | { type: 'confirm'; title: string; text: string; ok?: string; danger?: boolean; onConfirm: () => void };

export interface AppCtx {
  db: DB;
  setDB: Dispatch<SetStateAction<DB>>;
  money: (n: number) => string;
  toast: (msg: string, type?: 'ok' | 'error') => void;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  view: View;
  setView: (v: View) => void;
  month: string;
  setMonth: (m: string) => void;
  lock: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const AppContext = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppContext.Provider>');
  return ctx;
}
