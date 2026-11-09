import type { CSSProperties } from 'react';
import { catMeta } from '../lib/calc';
import { dayLabel } from '../lib/format';
import type { Tx } from '../lib/types';
import { useApp } from '../state';

const SIGN: Record<Tx['kind'], string> = { income: '+', expense: '−', save_in: '→ ', save_out: '← ' };
const KIND_LABEL: Record<Tx['kind'], string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  save_in: 'A ahorro',
  save_out: 'Desde ahorro',
};

export function TxRow({ tx, showDate = true }: { tx: Tx; showDate?: boolean }) {
  const { money, openModal } = useApp();
  const c = catMeta(tx);
  const title = tx.note || c.label;
  const meta = [tx.note ? c.label : KIND_LABEL[tx.kind], showDate ? dayLabel(tx.date) : null].filter(Boolean).join(' · ');

  return (
    <button className="tx" onClick={() => openModal({ type: 'tx', tx })}>
      <span className="tx-icon" style={{ '--c': c.color } as CSSProperties}>
        {c.emoji}
      </span>
      <span className="tx-body">
        <span className="tx-title">{title}</span>
        <span className="tx-meta">{meta}</span>
      </span>
      <span className={`tx-amt ${tx.kind}`}>
        {SIGN[tx.kind]}
        {money(tx.amount)}
      </span>
    </button>
  );
}
