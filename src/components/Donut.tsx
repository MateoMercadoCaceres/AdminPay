import { EXPENSE_CATS } from '../lib/constants';
import { useApp } from '../state';

const R = 15.9155; // circunferencia = 100

export function CategoryBreakdown({ byCat, total }: { byCat: Record<string, number>; total: number }) {
  const { money } = useApp();

  if (!total) {
    return (
      <div className="empty">
        <span className="em">🧾</span>
        <p>Aún no hay gastos este mes.</p>
      </div>
    );
  }

  const items = EXPENSE_CATS.filter((c) => byCat[c.id] > 0)
    .map((c) => ({ ...c, amount: byCat[c.id], pct: (byCat[c.id] / total) * 100 }))
    .sort((a, b) => b.amount - a.amount);

  const gap = items.length > 1 ? 0.8 : 0;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <div className="donut-box">
        <svg viewBox="0 0 36 36" className="donut" role="img" aria-label="Gastos por categoría">
          <circle r={R} cx="18" cy="18" fill="none" stroke="var(--surface-3)" strokeWidth="4.2" />
          {items.map((it) => {
            const len = Math.max(it.pct - gap, 0.3);
            const el = (
              <circle
                key={it.id}
                r={R}
                cx="18"
                cy="18"
                fill="none"
                stroke={it.color}
                strokeWidth="4.2"
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={-offset}
              >
                <title>{`${it.label}: ${money(it.amount)}`}</title>
              </circle>
            );
            offset += it.pct;
            return el;
          })}
        </svg>
        <div className="donut-center">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <ul className="legend">
        {items.map((it) => (
          <li key={it.id}>
            <span className="em">{it.emoji}</span>
            <span className="name">
              {it.label}
              <span className="pct">{Math.round(it.pct)}%</span>
            </span>
            <span className="amt">{money(it.amount)}</span>
            <span className="bar">
              <span style={{ width: `${it.pct}%`, background: it.color }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
