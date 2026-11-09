import { CategoryBreakdown } from '../components/Donut';
import { Icon } from '../components/Icon';
import { TxRow } from '../components/TxRow';
import { balances, monthTotals, sortTx } from '../lib/calc';
import { currentMonth, daysInMonth, monthOf } from '../lib/format';
import { useApp } from '../state';

export function Home() {
  const { db, money, month, openModal, setView } = useApp();
  const s = db.settings;
  const t = monthTotals(db.tx, month);
  const b = balances(db.tx);
  const recent = sortTx(db.tx.filter((x) => monthOf(x.date) === month)).slice(0, 6);

  const usedPct = t.income > 0 ? (t.expense / t.income) * 100 : t.expense > 0 ? 100 : 0;
  const meterClass = usedPct >= 90 ? 'danger' : usedPct >= 70 ? 'warn' : '';
  const goalPct = s.savingsGoal > 0 ? Math.min(100, (b.savings / s.savingsGoal) * 100) : 0;

  const isCurrent = month === currentMonth();
  const daysElapsed = isCurrent ? new Date().getDate() : daysInMonth(month);
  const dailyAvg = t.expense / Math.max(1, daysElapsed);

  let usageMsg: string;
  if (t.income === 0 && t.expense === 0) usageMsg = 'Registra tu sueldo o tus ingresos para ver cuánto te queda.';
  else if (t.income === 0) usageMsg = `Gastaste ${money(t.expense)} sin ingresos registrados este mes.`;
  else if (t.net >= 0) usageMsg = `Te quedan ${money(t.net)} de lo que ingresó este mes.`;
  else usageMsg = `Gastaste ${money(-t.net)} más de lo que ingresó este mes.`;

  return (
    <>
      {!(s.salary > 0) && (
        <div className="banner">
          <p>💼 Aún no configuraste tu <b>sueldo mensual</b>. Con él se calcula cuánto te sobra cada mes.</p>
          <button className="btn primary sm" onClick={() => setView('settings')}>Configurar</button>
        </div>
      )}

      <section className="card hero">
        <span className="eyebrow">{s.name ? `Hola, ${s.name}` : 'Hola 👋'} · Dinero disponible</span>
        <div className={`hero-amount ${b.available < 0 ? 'neg' : ''}`}>{money(b.available)}</div>
        <div className="hero-sub">
          Patrimonio total <b>{money(b.available + b.savings)}</b> · {money(b.savings)} en tu cuenta de ahorro
        </div>
        <div className="quick">
          <button className="qbtn" onClick={() => openModal({ type: 'tx', kind: 'expense' })}>
            <Icon name="minus" /> Gasto
          </button>
          <button className="qbtn" onClick={() => openModal({ type: 'tx', kind: 'income' })}>
            <Icon name="plus" /> Ingreso
          </button>
          <button className="qbtn" onClick={() => openModal({ type: 'savings', dir: 'in' })}>
            🐷 Ahorrar
          </button>
        </div>
      </section>

      <section className="stats">
        <div className="card stat">
          <div className="stat-label"><span className="stat-dot" style={{ background: 'var(--green-soft)' }}>💼</span>Ingresos del mes</div>
          <div className="stat-value">{money(t.income)}</div>
          <div className="stat-sub">Sueldo {money(t.salary)} · Extras {money(t.extra)}</div>
        </div>
        <div className="card stat">
          <div className="stat-label"><span className="stat-dot" style={{ background: 'var(--red-soft)' }}>💸</span>Gastos del mes</div>
          <div className="stat-value">{money(t.expense)}</div>
          <div className="stat-sub">Promedio {money(dailyAvg)} por día</div>
        </div>
        <div className="card stat">
          <div className="stat-label"><span className="stat-dot" style={{ background: 'var(--accent-soft)' }}>📈</span>Ahorrado del mes</div>
          <div className={`stat-value ${t.net > 0 ? 'pos' : t.net < 0 ? 'neg' : ''}`}>{money(t.net)}</div>
          <div className="stat-sub">Ingresos − gastos</div>
        </div>
        <button className="card stat" style={{ textAlign: 'left' }} onClick={() => setView('savings')}>
          <div className="stat-label"><span className="stat-dot" style={{ background: 'var(--accent-soft)' }}>🐷</span>Cuenta de ahorro</div>
          <div className="stat-value">{money(b.savings)}</div>
          {s.savingsGoal > 0 ? (
            <>
              <div className="meter accent" style={{ height: 6, margin: '6px 0 4px' }}><span style={{ width: `${goalPct}%` }} /></div>
              <div className="stat-sub">{Math.round(goalPct)}% de la meta {money(s.savingsGoal)}</div>
            </>
          ) : (
            <div className="stat-sub">Sin meta definida</div>
          )}
        </button>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Uso de tus ingresos</h3>
          <span className="muted small">{t.income > 0 ? `${Math.round(usedPct)}% gastado` : '—'}</span>
        </div>
        <div className={`meter ${meterClass}`}><span style={{ width: `${Math.min(100, usedPct)}%` }} /></div>
        <p className="muted small" style={{ margin: '10px 0 0' }}>{usageMsg}</p>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Gastos por categoría</h3></div>
          <CategoryBreakdown byCat={t.byCat} total={t.expense} />
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Últimos movimientos</h3>
            {recent.length > 0 && <button className="link" onClick={() => setView('movements')}>Ver todos</button>}
          </div>
          {recent.length ? (
            <div className="tx-list">{recent.map((x) => <TxRow key={x.id} tx={x} />)}</div>
          ) : (
            <div className="empty">
              <span className="em">✨</span>
              <p>Sin movimientos este mes.</p>
              <button className="btn primary sm" onClick={() => openModal({ type: 'tx', kind: 'expense' })}>Agregar el primero</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
