import { Icon } from '../components/Icon';
import { TxRow } from '../components/TxRow';
import { balances, history, isSaving, monthTotals, sortTx } from '../lib/calc';
import { currentMonth, shortMonthLabel } from '../lib/format';
import { useApp } from '../state';

export function Savings() {
  const { db, money, month, openModal } = useApp();
  const b = balances(db.tx);
  const goal = db.settings.savingsGoal;
  const goalPct = goal > 0 ? Math.min(100, (b.savings / goal) * 100) : 0;
  const t = monthTotals(db.tx, month);
  const moves = sortTx(db.tx.filter(isSaving)).slice(0, 15);
  const rows = history(db.tx);
  const totalSaved = rows.reduce((acc, r) => acc + r.net, 0);
  const now = currentMonth();

  return (
    <>
      <section className="vault">
        <div className="card hero vault-main">
          <span className="eyebrow">🐷 Cuenta de ahorro</span>
          <div className="hero-amount">{money(b.savings)}</div>
          <div className="hero-sub">Dinero separado de tu disponible. Solo cambia cuando depositas o retiras.</div>
          {goal > 0 && (
            <>
              <div className="goal-line">
                <span>Meta {money(goal)}</span>
                <span>{goalPct >= 100 ? '¡Meta cumplida! 🎉' : `Faltan ${money(goal - b.savings)}`}</span>
              </div>
              <div className="meter on-hero"><span style={{ width: `${goalPct}%` }} /></div>
            </>
          )}
          <div className="vault-actions">
            <button className="btn white" onClick={() => openModal({ type: 'savings', dir: 'in' })}>
              <Icon name="down" /> Depositar
            </button>
            <button className="btn glass" onClick={() => openModal({ type: 'savings', dir: 'out' })} disabled={b.savings <= 0}>
              <Icon name="up" /> Retirar
            </button>
            <button className="btn glass" onClick={() => openModal({ type: 'goal' })}>
              <Icon name="target" /> {goal > 0 ? 'Editar meta' : 'Definir meta'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Resumen</h3></div>
          <div className="setting-row">
            <div className="txt"><b>Disponible para ahorrar</b><span>Lo que tienes fuera del ahorro</span></div>
            <strong className={`num ${b.available < 0 ? 'neg' : ''}`}>{money(b.available)}</strong>
          </div>
          <div className="setting-row">
            <div className="txt"><b>Ahorrado este mes</b><span>Ingresos − gastos del mes elegido</span></div>
            <strong className={`num ${t.net > 0 ? 'pos' : t.net < 0 ? 'neg' : ''}`}>{money(t.net)}</strong>
          </div>
          <div className="setting-row">
            <div className="txt"><b>Movido al ahorro este mes</b><span>Depósitos − retiros</span></div>
            <strong className="num">{money(t.saveIn - t.saveOut)}</strong>
          </div>
          <div className="setting-row">
            <div className="txt"><b>Acumulado histórico</b><span>Suma de lo que te sobró cada mes</span></div>
            <strong className={`num ${totalSaved < 0 ? 'neg' : 'pos'}`}>{money(totalSaved)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Montos ahorrados y acumulados por mes</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Ahorrado</th>
                <th>Disponible acum.</th>
                <th>Cuenta ahorro</th>
                <th>Total acumulado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className={r.month === now ? 'current' : ''}>
                  <td className="month-cell">{shortMonthLabel(r.month)}</td>
                  <td className="pos">{money(r.income)}</td>
                  <td>{money(r.expense)}</td>
                  <td className={r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : ''}>{money(r.net)}</td>
                  <td className={r.available < 0 ? 'neg' : ''}>{money(r.available)}</td>
                  <td>{money(r.savings)}</td>
                  <td><b>{money(r.available + r.savings)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Movimientos de la cuenta de ahorro</h3></div>
        {moves.length ? (
          <div className="tx-list">{moves.map((x) => <TxRow key={x.id} tx={x} />)}</div>
        ) : (
          <div className="empty">
            <span className="em">🐷</span>
            <p>Todavía no metiste dinero a tu cuenta de ahorro.</p>
            <button className="btn primary sm" onClick={() => openModal({ type: 'savings', dir: 'in' })}>Hacer el primer depósito</button>
          </div>
        )}
      </section>
    </>
  );
}
