import { useState, type FormEvent } from 'react';
import { CURRENCIES } from '../lib/constants';
import { currencySymbol, currentMonth, monthLabel, pad, parseAmount, todayStr, uid } from '../lib/format';
import { hashPin, pinAlgo, verifyPin } from '../lib/pin';
import { useApp } from '../state';

export function GoalForm({ onClose }: { onClose: () => void }) {
  const { db, updateSettings, toast, money } = useApp();
  const [value, setValue] = useState(db.settings.savingsGoal ? String(db.settings.savingsGoal) : '');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = value.trim() === '' ? 0 : parseAmount(value);
    if (!(n >= 0)) return setError('Ingresa un monto válido.');
    updateSettings({ savingsGoal: n });
    toast(n ? `Meta de ahorro: ${money(n)}` : 'Meta eliminada');
    onClose();
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <p className="form-hint" style={{ margin: 0 }}>¿Cuánto quieres juntar en tu cuenta de ahorro? Déjalo vacío para quitar la meta.</p>
      <label className="amount-field">
        <span className="cur">{currencySymbol(db.settings.currency)}</span>
        <input inputMode="decimal" placeholder="0" value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label="Meta" />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button className="btn primary" type="submit">Guardar meta</button>
      </div>
    </form>
  );
}

const PinInput = (props: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) => (
  <label className="field">
    <span className="label">{props.label}</span>
    <input
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      placeholder="••••"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      autoFocus={props.autoFocus}
      style={{ letterSpacing: '0.4em', fontSize: 20 }}
    />
  </label>
);

export function PinForm({ onClose }: { onClose: () => void }) {
  const { db, setDB, toast } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db.pin) return;
    if (!(await verifyPin(current, db.pin))) return setError('El PIN actual no es correcto.');
    if (!/^\d{4}$/.test(next)) return setError('El nuevo PIN debe tener 4 dígitos.');
    if (next !== confirm) return setError('Los PIN nuevos no coinciden.');
    const algo = pinAlgo();
    const salt = uid();
    const hash = await hashPin(next, salt, algo);
    setDB((d) => ({ ...d, pin: { salt, hash, algo } }));
    toast('PIN actualizado');
    onClose();
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <PinInput label="PIN actual" value={current} onChange={(v) => { setCurrent(v); setError(''); }} autoFocus />
      <PinInput label="Nuevo PIN" value={next} onChange={(v) => { setNext(v); setError(''); }} />
      <PinInput label="Confirmar nuevo PIN" value={confirm} onChange={(v) => { setConfirm(v); setError(''); }} />
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button className="btn primary" type="submit">Cambiar PIN</button>
      </div>
    </form>
  );
}

export function OnboardingForm({ onClose }: { onClose: () => void }) {
  const { db, setDB, toast } = useApp();
  const [name, setName] = useState(db.settings.name);
  const [salary, setSalary] = useState('');
  const [payday, setPayday] = useState('1');
  const [currency, setCurrency] = useState(db.settings.currency);
  const [registerNow, setRegisterNow] = useState(true);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = salary.trim() === '' ? 0 : parseAmount(salary);
    if (!(s >= 0)) return setError('Ingresa un sueldo válido.');
    const day = Math.min(31, Math.max(1, parseInt(payday, 10) || 1));
    const m = currentMonth();

    setDB((d) => {
      const settings = { ...d.settings, name: name.trim().slice(0, 40), salary: s, payday: day, currency };
      if (!(registerNow && s > 0)) return { ...d, settings };
      const today = new Date().getDate();
      const date = today >= day ? `${m}-${pad(day)}` : todayStr();
      return {
        ...d,
        settings,
        salaryMonths: [...d.salaryMonths, m],
        tx: [...d.tx, { id: uid(), kind: 'income', category: 'sueldo', amount: s, note: 'Sueldo mensual', date, createdAt: Date.now() }],
      };
    });
    toast(registerNow && s > 0 ? `Listo. Sueldo de ${monthLabel(m)} registrado` : '¡Todo listo!');
    onClose();
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <p className="form-hint" style={{ margin: 0 }}>
        Tu PIN quedó guardado. Configura lo básico (puedes cambiarlo luego en Ajustes).
      </p>
      <label className="field">
        <span className="label">¿Cómo te llamas? <em>(opcional)</em></span>
        <input maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
      </label>
      <label className="field">
        <span className="label">Moneda</span>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="label">Sueldo mensual</span>
        <input inputMode="decimal" value={salary} onChange={(e) => { setSalary(e.target.value); setError(''); }} placeholder={`Ej. ${currencySymbol(currency)}1500`} />
      </label>
      <label className="field">
        <span className="label">Día de pago</span>
        <input type="number" min={1} max={31} value={payday} onChange={(e) => setPayday(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={registerNow} onChange={(e) => setRegisterNow(e.target.checked)} />
        Registrar el sueldo de este mes ahora
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>Omitir</button>
        <button className="btn primary" type="submit">Empezar</button>
      </div>
    </form>
  );
}
