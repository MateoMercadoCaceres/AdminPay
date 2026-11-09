import { useMemo, useState } from 'react';
import { TxRow } from '../components/TxRow';
import { catMeta, isSaving, monthTotals, sortTx } from '../lib/calc';
import { EXPENSE_CATS, INCOME_CATS } from '../lib/constants';
import { dayLabel, monthOf } from '../lib/format';
import type { Tx } from '../lib/types';
import { useApp } from '../state';

type KindFilter = 'all' | 'expense' | 'income' | 'saving';

const KIND_CHIPS: [KindFilter, string][] = [
  ['all', 'Todos'],
  ['expense', 'Gastos'],
  ['income', 'Ingresos'],
  ['saving', 'Ahorro'],
];

export function Movements() {
  const { db, money, month, openModal } = useApp();
  const [kind, setKind] = useState<KindFilter>('all');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const t = monthTotals(db.tx, month);
  const catOptions = kind === 'income' ? INCOME_CATS : kind === 'expense' ? EXPENSE_CATS : [];

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = sortTx(
      db.tx.filter((x) => {
        if (monthOf(x.date) !== month) return false;
        if (kind === 'saving' && !isSaving(x)) return false;
        if ((kind === 'expense' || kind === 'income') && x.kind !== kind) return false;
        if (cat !== 'all' && x.category !== cat) return false;
        if (query && !`${x.note} ${catMeta(x).label}`.toLowerCase().includes(query)) return false;
        return true;
      }),
    );
    const map = new Map<string, Tx[]>();
    for (const x of list) map.set(x.date, [...(map.get(x.date) ?? []), x]);
    return [...map.entries()];
  }, [db.tx, month, kind, cat, q]);

  const filteredTotal = groups.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <>
      <div className="summary-row">
        <span>Ingresos <strong className="pos">{money(t.income)}</strong></span>
        <span>Gastos <strong>{money(t.expense)}</strong></span>
        <span>Al ahorro <strong>{money(t.saveIn - t.saveOut)}</strong></span>
        <span>Movimientos <strong>{t.count}</strong></span>
      </div>

      <div className="toolbar">
        <div className="chips">
          {KIND_CHIPS.map(([k, label]) => (
            <button key={k} className={`chip ${kind === k ? 'active' : ''}`} onClick={() => { setKind(k); setCat('all'); }}>
              {label}
            </button>
          ))}
        </div>
        {catOptions.length > 0 && (
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
            <option value="all">Todas las categorías</option>
            {catOptions.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        )}
        <input className="search" type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar movimientos" />
      </div>

      <section className="card">
        {filteredTotal === 0 ? (
          <div className="empty">
            <span className="em">🔎</span>
            <p>{t.count === 0 ? 'No hay movimientos en este mes.' : 'Ningún movimiento coincide con los filtros.'}</p>
            {t.count === 0 && <button className="btn primary sm" onClick={() => openModal({ type: 'tx', kind: 'expense' })}>Agregar movimiento</button>}
          </div>
        ) : (
          groups.map(([date, items]) => {
            const dayExpense = items.filter((x) => x.kind === 'expense').reduce((a, x) => a + x.amount, 0);
            return (
              <div className="day-group" key={date}>
                <div className="day-head">
                  <span>{dayLabel(date)}</span>
                  {dayExpense > 0 && <span>−{money(dayExpense)}</span>}
                </div>
                <div className="tx-list">{items.map((x) => <TxRow key={x.id} tx={x} showDate={false} />)}</div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
