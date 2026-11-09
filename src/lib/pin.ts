import type { PinData } from './types';

export const pinAlgo = (): PinData['algo'] =>
  typeof crypto !== 'undefined' && crypto.subtle ? 'sha256' : 'fnv';

export async function hashPin(pin: string, salt: string, algo: PinData['algo']): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}:adminpay`);
  if (algo === 'sha256') {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Respaldo para contextos sin crypto.subtle (http sin TLS)
  let h = 0x811c9dc5;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export async function verifyPin(pin: string, data: PinData): Promise<boolean> {
  return (await hashPin(pin, data.salt, data.algo)) === data.hash;
}
