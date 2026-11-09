import { useState, type FormEvent } from 'react';
import { balances } from '../lib/calc';
import { currencySymbol, currentMonth, isDateStr, monthOf, parseAmount, todayStr, uid } from '../lib/format';
import type { Tx } from '../lib/types';
import { useApp } from '../state';

interface Props {
  dir?: 'in' | 'out';
  tx?: Tx;
  onClose: () => void;
}

export function SavingsForm({ dir: initialDir = 'in', tx, onClose }: Props) {
  const { db, setDB, month, setMonth, toast, money, openModal } = useApp();
  const [dir, setDir] = useState<'in' | 'out'>(tx ? (tx.kind === 'save_in' ? 'in' : 'out') : initialDir);
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '');
  const [note, setNote] = useState(tx?.note ?? '');
  const [date, setDate] = useState(tx?.date ?? (month === currentMonth() ? todayStr() : `${month}-01`));
  const [error, setError] = useState('');

  // Saldos sin contar el movimiento que se está editando
  const b = balances(db.tx, tx?.id);
  const max = Math.max(0, dir === 'in' ? b.available : b.savings);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Ingresa un monto mayor a 0.');
    if (!isDateStr(date)) return setError('Elige una fecha válida.');
    if (value > max) {
      return setError(
        dir === 'in'
          ? `Solo tienes ${money(max)} disponible para pasar al ahorro.`
          : `Tu cuenta de ahorro solo tiene ${money(max)}.`,
      );
    }
    const data = { kind: dir === 'in' ? 'save_in' : 'save_out', category: 'ahorro', amount: value, note: note.trim(), date } as const;
    setDB((d) => ({
      ...d,
      tx: tx ? d.tx.map((t) => (t.id === tx.id ? { ...t, ...data } : t)) : [...d.tx, { id: uid(), createdAt: Date.now(), ...data }],
    }));
    if (monthOf(date) !== month) setMonth(monthOf(date));
    toast(dir === 'in' ? `🐷 ${money(value)} enviados a tu cuenta de ahorro` : `${money(value)} retirados del ahorro`);
    onClose();
  };

  const remove = () => {
    if (!tx) return;
    openModal({
      type: 'confirm',
      title: 'Eliminar movimiento de ahorro',
      text: `Se eliminará este ${tx.kind === 'save_in' ? 'depósito' : 'retiro'} de ${money(tx.amount)} y los saldos se recalcularán.`,
      ok: 'Eliminar',
      danger: true,
      onConfirm: () => {
        setDB((d) => ({ ...d, tx: d.tx.filter((t) => t.id !== tx.id) }));
        toast('Movimiento eliminado');
      },
    });
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="seg">
        <button type="button" data-dir="in" className={dir === 'in' ? 'active' : ''} onClick={() => { setDir('in'); setError(''); }}>
          Depositar
        </button>
        <button type="button" data-dir="out" className={dir === 'out' ? 'active' : ''} onClick={() => { setDir('out'); setError(''); }}>
          Retirar
        </button>
      </div>

      <p className="form-hint">
        {dir === 'in' ? (
          <>Mueve dinero de tu disponible (<b>{money(b.available)}</b>) a la cuenta de ahorro.</>
        ) : (
          <>Regresa dinero de tu ahorro (<b>{money(b.savings)}</b>) al disponible.</>
        )}
      </p>

      <label className="amount-field">
        <span className="cur">{currencySymbol(db.settings.currency)}</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(''); }}
          autoFocus
          aria-label="Monto"
        />
        {max > 0 && (
          <button type="button" className="max-btn" onClick={() => setAmount(String(max))}>
            Todo
          </button>
        )}
      </label>

      <label className="field">
        <span className="label">Nota <em>(opcional)</em></span>
        <input maxLength={80} placeholder="Ej. fondo de emergencia" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <label className="field">
        <span className="label">Fecha</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="modal-actions">
        {tx && (
          <button type="button" className="btn danger-ghost" onClick={remove}>
            Eliminar
          </button>
        )}
        <button className="btn primary" type="submit">
          {tx ? 'Guardar cambios' : dir === 'in' ? 'Depositar al ahorro' : 'Retirar del ahorro'}
        </button>
      </div>
    </form>
  );
}
