import type { Category } from './types';

export const EXPENSE_CATS: Category[] = [
  { id: 'comida', label: 'Comida', emoji: '🍔', color: '#ff8a4c' },
  { id: 'fiesta', label: 'Fiesta', emoji: '🎉', color: '#ff4fa3' },
  { id: 'juegos', label: 'Juegos', emoji: '🎮', color: '#8b6cff' },
  { id: 'web', label: 'Web', emoji: '🌐', color: '#5b7cff' },
  { id: 'ia', label: 'IA', emoji: '🤖', color: '#22d3c5' },
  { id: 'luz', label: 'Luz', emoji: '💡', color: '#ffc93c' },
  { id: 'agua', label: 'Agua', emoji: '💧', color: '#38bdf8' },
  { id: 'gas', label: 'Gas', emoji: '🔥', color: '#ff5c5c' },
  { id: 'casa', label: 'Cosas para casa', emoji: '🏠', color: '#2ecc8f' },
];

export const INCOME_CATS: Category[] = [
  { id: 'sueldo', label: 'Sueldo', emoji: '💼', color: '#2ecc8f' },
  { id: 'extra', label: 'Extra', emoji: '✨', color: '#ffc93c' },
  { id: 'freelance', label: 'Freelance', emoji: '💻', color: '#5b7cff' },
  { id: 'venta', label: 'Venta', emoji: '🏷️', color: '#ff8a4c' },
  { id: 'regalo', label: 'Regalo', emoji: '🎁', color: '#ff4fa3' },
  { id: 'otro', label: 'Otro', emoji: '💰', color: '#22d3c5' },
];

export const SAVING_META: Record<'save_in' | 'save_out', Category> = {
  save_in: { id: 'save_in', label: 'Depósito a ahorro', emoji: '🐷', color: '#8b6cff' },
  save_out: { id: 'save_out', label: 'Retiro de ahorro', emoji: '↩️', color: '#8d94a8' },
};

export const CURRENCIES: [code: string, label: string][] = [
  ['USD', 'Dólar (USD)'],
  ['BOB', 'Boliviano (BOB)'],
  ['MXN', 'Peso mexicano (MXN)'],
  ['COP', 'Peso colombiano (COP)'],
  ['ARS', 'Peso argentino (ARS)'],
  ['CLP', 'Peso chileno (CLP)'],
  ['PEN', 'Sol peruano (PEN)'],
  ['EUR', 'Euro (EUR)'],
  ['GTQ', 'Quetzal (GTQ)'],
  ['UYU', 'Peso uruguayo (UYU)'],
  ['PYG', 'Guaraní (PYG)'],
  ['DOP', 'Peso dominicano (DOP)'],
];

export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;
