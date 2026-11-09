import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { CURRENCIES } from '../lib/constants';
import { parseAmount, todayStr } from '../lib/format';
import { clearDB, exportBackup, parseBackup } from '../lib/storage';
import type { ThemePref } from '../lib/types';
import { useApp } from '../state';

/** Input de texto que guarda al salir del campo o al presionar Enter. */
function CommitInput(props: {
  value: string;
  onCommit: (v: string) => boolean | void;
  inputMode?: 'decimal' | 'numeric' | 'text';
  placeholder?: string;
  maxLength?: number;
  label: string;
}) {
  const [v, setV] = useState(props.value);
  const [prev, setPrev] = useState(props.value);
  if (props.value !== prev) {
    setPrev(props.value);
    setV(props.value);
  }
  const commit = () => {
    if (v === props.value) return;
    if (props.onCommit(v) === false) setV(props.value);
  };
  return (
    <input
      aria-label={props.label}
      value={v}
      inputMode={props.inputMode}
      placeholder={props.placeholder}
      maxLength={props.maxLength}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function Settings() {
  const { db, setDB, updateSettings, toast, money, openModal, lock } = useApp();
  const s = db.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  const saved = () => toast('Guardado');

  const exportData = () => {
    const blob = new Blob([exportBackup(db)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adminpay-respaldo-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Respaldo descargado');
  };

  const importData = async (file: File) => {
    try {
      const data = parseBackup(await file.text());
      openModal({
        type: 'confirm',
        title: 'Importar respaldo',
        text: `Se reemplazarán tus datos actuales por los del archivo (${data.tx.length} movimientos). Tu PIN actual se mantiene.`,
        ok: 'Importar',
        onConfirm: () => {
          setDB((d) => ({ ...d, ...data }));
          toast('Respaldo importado');
        },
      });
    } catch (err) {
      toast(err instanceof Error && err.message.includes('AdminPay') ? err.message : 'No se pudo leer el archivo.', 'error');
    }
  };

  const resetAll = () =>
    openModal({
      type: 'confirm',
      title: 'Borrar todos los datos',
      text: 'Se eliminarán tu PIN, sueldo, movimientos y cuenta de ahorro de este dispositivo. Te recomendamos exportar un respaldo antes. No se puede deshacer.',
      ok: 'Borrar todo',
      danger: true,
      onConfirm: () => {
        clearDB();
        location.reload();
      },
    });

  return (
    <div className="settings">
      <section className="card">
        <div className="card-head"><h3>💼 Sueldo</h3></div>
        <div className="setting-row">
          <div className="txt"><b>Sueldo mensual</b><span>Se usa para calcular tu ahorro del mes</span></div>
          <CommitInput
            label="Sueldo mensual"
            inputMode="decimal"
            placeholder="0"
            value={s.salary ? String(s.salary) : ''}
            onCommit={(v) => {
              const n = v.trim() === '' ? 0 : parseAmount(v);
              if (!(n >= 0)) {
                toast('Monto inválido', 'error');
                return false;
              }
              updateSettings({ salary: n });
              saved();
            }}
          />
        </div>
        <div className="setting-row">
          <div className="txt"><b>Día de pago</b><span>Día del mes en que cobras (1–31)</span></div>
          <CommitInput
            label="Día de pago"
            inputMode="numeric"
            value={String(s.payday)}
            onCommit={(v) => {
              const n = parseInt(v, 10);
              if (!(n >= 1 && n <= 31)) {
                toast('Elige un día entre 1 y 31', 'error');
                return false;
              }
              updateSettings({ payday: n });
              saved();
            }}
          />
        </div>
        <div className="setting-row">
          <div className="txt"><b>Registrar sueldo automáticamente</b><span>Cada mes, al llegar el día de pago</span></div>
          <label className="switch">
            <input
              type="checkbox"
              checked={s.autoSalary}
              onChange={(e) => {
                updateSettings({ autoSalary: e.target.checked });
                saved();
              }}
              aria-label="Registrar sueldo automáticamente"
            />
            <span />
          </label>
        </div>
        <div className="setting-row">
          <div className="txt"><b>Registrar sueldo ahora</b><span>Agrega manualmente un pago de sueldo</span></div>
          <button
            className="btn ghost sm"
            onClick={() =>
              openModal({ type: 'tx', preset: { kind: 'income', category: 'sueldo', amount: s.salary || undefined, note: 'Sueldo mensual', date: todayStr() } })
            }
          >
            <Icon name="plus" /> {s.salary ? money(s.salary) : 'Registrar'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>🎨 Preferencias</h3></div>
        <div className="setting-row">
          <div className="txt"><b>Tu nombre</b><span>Para saludarte en el inicio</span></div>
          <CommitInput
            label="Nombre"
            maxLength={40}
            placeholder="Opcional"
            value={s.name}
            onCommit={(v) => {
              updateSettings({ name: v.trim() });
              saved();
            }}
          />
        </div>
        <div className="setting-row">
          <div className="txt"><b>Moneda</b></div>
          <select value={s.currency} onChange={(e) => { updateSettings({ currency: e.target.value }); saved(); }} aria-label="Moneda">
            {CURRENCIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </div>
        <div className="setting-row">
          <div className="txt"><b>Tema</b></div>
          <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as ThemePref })} aria-label="Tema">
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
            <option value="system">Según el sistema</option>
          </select>
        </div>
        <div className="setting-row">
          <div className="txt"><b>Bloqueo automático</b><span>Pide el PIN tras inactividad</span></div>
          <select value={s.autoLock} onChange={(e) => { updateSettings({ autoLock: Number(e.target.value) }); saved(); }} aria-label="Bloqueo automático">
            <option value={1}>1 minuto</option>
            <option value={5}>5 minutos</option>
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={0}>Nunca</option>
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>🔒 Seguridad</h3></div>
        <div className="btn-col">
          <button className="btn ghost" onClick={() => openModal({ type: 'pin' })}><Icon name="key" /> Cambiar PIN</button>
          <button className="btn ghost" onClick={lock}><Icon name="lock" /> Bloquear ahora</button>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>💾 Tus datos</h3></div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Todo se guarda solo en este navegador. Exporta un respaldo para no perderlo o para pasarlo a otro dispositivo.
        </p>
        <div className="btn-col">
          <button className="btn ghost" onClick={exportData}><Icon name="download" /> Exportar respaldo</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}><Icon name="upload" /> Importar respaldo</button>
          <button className="btn danger-ghost" onClick={resetAll}><Icon name="trash" /> Borrar todos los datos</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void importData(f);
          }}
        />
      </section>
    </div>
  );
}
