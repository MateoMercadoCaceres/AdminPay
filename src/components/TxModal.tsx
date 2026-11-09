import { useState, type CSSProperties, type FormEvent } from 'react';
import { EXPENSE_CATS, INCOME_CATS } from '../lib/constants';
import { currencySymbol, currentMonth, isDateStr, monthLabel, monthOf, parseAmount, todayStr, uid } from '../lib/format';
import type { Tx } from '../lib/types';
import { useApp } from '../state';

interface Props {
  kind?: 'expense' | 'income';
  tx?: Tx;
  preset?: Partial<Tx>;
  onClose: () => void;
}

export function TxForm({ kind: initialKind = 'expense', tx, preset, onClose }: Props) {
  const { db, setDB, month, setMonth, toast, money, openModal } = useApp();
  const defaultDate = month === currentMonth() ? todayStr() : `${month}-01`;

  const [kind, setKind] = useState<'expense' | 'income'>(
    tx?.kind === 'income' || tx?.kind === 'expense' ? tx.kind : (preset?.kind as 'expense' | 'income') ?? initialKind,
  );
  const [category, setCategory] = useState<string | null>(tx?.category ?? preset?.category ?? null);
  const [amount, setAmount] = useState(tx ? String(tx.amount) : preset?.amount ? String(preset.amount) : '');
  const [note, setNote] = useState(tx?.note ?? preset?.note ?? '');
  const [date, setDate] = useState(tx?.date ?? preset?.date ?? defaultDate);
  const [error, setError] = useState('');

  const cats = kind === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  const switchKind = (k: 'expense' | 'income') => {
    setKind(k);
    if (!(k === 'expense' ? EXPENSE_CATS : INCOME_CATS).some((c) => c.id === category)) setCategory(null);
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amount);
    if (!(value > 0)) return setError('Ingresa un monto mayor a 0.');
    if (!category) return setError('Elige una categoría.');
    if (!isDateStr(date)) return setError('Elige una fecha válida.');

    const data = { kind, category, amount: value, note: note.trim(), date };
    const isSalary = kind === 'income' && category === 'sueldo';

    setDB((d) => {
      const list = tx ? d.tx.map((t) => (t.id === tx.id ? { ...t, ...data } : t)) : [...d.tx, { id: uid(), createdAt: Date.now(), ...data }];
      const m = monthOf(date);
      const salaryMonths = isSalary && !d.salaryMonths.includes(m) ? [...d.salaryMonths, m] : d.salaryMonths;
      return { ...d, tx: list, salaryMonths };
    });

    if (monthOf(date) !== month) setMonth(monthOf(date));
    const verb = tx ? 'actualizado' : kind === 'expense' ? 'registrado' : 'agregado';
    toast(`${kind === 'expense' ? 'Gasto' : 'Ingreso'} ${verb}: ${money(value)}${monthOf(date) !== month ? ` (${monthLabel(monthOf(date))})` : ''}`);
    onClose();
  };

  const remove = () => {
    if (!tx) return;
    openModal({
      type: 'confirm',
      title: 'Eliminar movimiento',
      text: `Se eliminará "${tx.note || cats.find((c) => c.id === tx.category)?.label || 'este movimiento'}" por ${money(tx.amount)}.`,
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
      <div className="seg" role="tablist">
        <button type="button" data-kind="expense" className={kind === 'expense' ? 'active' : ''} onClick={() => switchKind('expense')}>
          Gasto
        </button>
        <button type="button" data-kind="income" className={kind === 'income' ? 'active' : ''} onClick={() => switchKind('income')}>
          Ingreso
        </button>
      </div>

      <label className="amount-field">
        <span className="cur">{currencySymbol(db.settings.currency)}</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          autoFocus
          aria-label="Monto"
        />
      </label>

      <div className="field">
        <span className="label">Categoría</span>
        <div className="cats">
          {cats.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`cat ${category === c.id ? 'active' : ''}`}
              style={{ '--c': c.color } as CSSProperties}
              onClick={() => {
                setCategory(c.id);
                setError('');
              }}
            >
              <span className="em">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="label">
          Descripción <em>(opcional)</em>
        </span>
        <input
          maxLength={80}
          placeholder={kind === 'expense' ? 'Ej. almuerzo con amigos' : 'Ej. pago de un cliente'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
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
          {tx ? 'Guardar cambios' : kind === 'expense' ? 'Agregar gasto' : 'Agregar ingreso'}
        </button>
      </div>
    </form>
  );
}
