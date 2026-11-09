import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from './components/Icon';
import { LockScreen } from './components/LockScreen';
import { ConfirmModal, Modal } from './components/Modal';
import { SavingsForm } from './components/SavingsModal';
import { GoalForm, OnboardingForm, PinForm } from './components/SettingsModals';
import { TxForm } from './components/TxModal';
import { withAutoSalary } from './lib/calc';
import { currentMonth, formatMoney, monthLabel, monthOf, shiftMonth } from './lib/format';
import { loadDB, saveDB } from './lib/storage';
import type { DB, Settings as SettingsT, View } from './lib/types';
import { AppContext, type AppCtx, type ModalState } from './state';
import { Home } from './views/Home';
import { Movements } from './views/Movements';
import { Savings } from './views/Savings';
import { Settings } from './views/Settings';

const NAV: [View, string, IconName][] = [
  ['home', 'Inicio', 'home'],
  ['movements', 'Movimientos', 'list'],
  ['savings', 'Ahorro', 'coins'],
  ['settings', 'Ajustes', 'sliders'],
];

interface Toast {
  id: number;
  msg: string;
  type: 'ok' | 'error';
}

function resolveTheme(pref: SettingsT['theme']): 'dark' | 'light' {
  if (pref !== 'system') return pref;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function App() {
  const [db, setDB] = useState<DB>(loadDB);
  const [unlocked, setUnlocked] = useState(false);
  const [view, setView] = useState<View>('home');
  const [month, setMonth] = useState(currentMonth);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dbRef = useRef(db);
  dbRef.current = db;
  const lastActivity = useRef(Date.now());

  const toast = useCallback((msg: string, type: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  // Persistencia
  useEffect(() => {
    if (!saveDB(db)) toast('No se pudo guardar: el almacenamiento del navegador está bloqueado o lleno.', 'error');
  }, [db, toast]);

  // Tema
  useEffect(() => {
    const apply = () => {
      const t = resolveTheme(db.settings.theme);
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0b0d12' : '#f3f4f8');
    };
    apply();
    if (db.settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [db.settings.theme]);

  const lock = useCallback(() => {
    setModal(null);
    setUnlocked(false);
  }, []);

  // Bloqueo por inactividad
  useEffect(() => {
    if (!unlocked) return;
    const mark = () => (lastActivity.current = Date.now());
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const check = () => {
      const mins = dbRef.current.settings.autoLock;
      if (mins > 0 && Date.now() - lastActivity.current > mins * 60_000) lock();
    };
    const timer = setInterval(check, 10_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [unlocked, lock]);

  const runAutoSalary = useCallback(
    (base: DB) => {
      const r = withAutoSalary(base);
      if (r.db !== dbRef.current) setDB(r.db);
      if (r.added) toast(`💼 Sueldo de ${monthLabel(monthOf(r.added.date))} registrado`);
    },
    [toast],
  );

  const updateSettings = useCallback(
    (patch: Partial<SettingsT>) => {
      const d = dbRef.current;
      runAutoSalary({ ...d, settings: { ...d.settings, ...patch } });
    },
    [runAutoSalary],
  );

  const handleUnlock = (isNew: boolean) => {
    lastActivity.current = Date.now();
    setUnlocked(true);
    setMonth(currentMonth());
    if (isNew) setModal({ type: 'onboarding' });
    else runAutoSalary(dbRef.current);
  };

  const closeModal = useCallback(() => setModal(null), []);

  const ctx: AppCtx = useMemo(
    () => ({
      db,
      setDB,
      money: (n: number) => formatMoney(n, db.settings.currency),
      toast,
      openModal: setModal,
      closeModal,
      view,
      setView: (v: View) => {
        setView(v);
        window.scrollTo({ top: 0 });
      },
      month,
      setMonth,
      lock,
      updateSettings,
    }),
    [db, toast, closeModal, view, month, lock, updateSettings],
  );

  const theme = resolveTheme(db.settings.theme);

  return (
    <AppContext.Provider value={ctx}>
      {!unlocked ? (
        <LockScreen onUnlock={handleUnlock} />
      ) : (
        <div className="app">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark" aria-hidden="true"><Icon name="logo" /></div>
              <span>AdminPay</span>
            </div>
            <nav className="nav" aria-label="Secciones">
              {NAV.map(([id, label, icon]) => (
                <button key={id} className={view === id ? 'active' : ''} onClick={() => ctx.setView(id)} aria-current={view === id ? 'page' : undefined}>
                  <Icon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <p className="sidebar-foot">Tus datos se guardan solo en este dispositivo.</p>
          </aside>

          <main className="main">
            <header className="topbar">
              {view === 'settings' ? (
                <h2 className="topbar-title">Ajustes</h2>
              ) : (
                <div className="month-switch">
                  <button className="icon-btn" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Mes anterior"><Icon name="left" /></button>
                  <button className="month-label" onClick={() => setMonth(currentMonth())} title="Volver al mes actual">{monthLabel(month)}</button>
                  <button className="icon-btn" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Mes siguiente"><Icon name="right" /></button>
                </div>
              )}
              <div className="topbar-actions">
                <button
                  className="icon-btn"
                  onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
                  aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                >
                  <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
                </button>
                <button className="icon-btn" onClick={lock} aria-label="Bloquear"><Icon name="lock" /></button>
              </div>
            </header>

            <div className="view" key={view}>
              {view === 'home' && <Home />}
              {view === 'movements' && <Movements />}
              {view === 'savings' && <Savings />}
              {view === 'settings' && <Settings />}
            </div>
          </main>

          {view !== 'settings' && (
            <button className="fab" onClick={() => setModal({ type: 'tx', kind: 'expense' })} aria-label="Agregar movimiento">
              <Icon name="plus" />
            </button>
          )}
        </div>
      )}

      {modal && <ModalHost modal={modal} onClose={closeModal} />}

      <div className="toast-root" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`}>{t.msg}</div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

function ModalHost({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  switch (modal.type) {
    case 'tx': {
      if (modal.tx && (modal.tx.kind === 'save_in' || modal.tx.kind === 'save_out')) {
        return (
          <Modal title="Editar movimiento de ahorro" onClose={onClose}>
            <SavingsForm tx={modal.tx} onClose={onClose} />
          </Modal>
        );
      }
      return (
        <Modal title={modal.tx ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={onClose}>
          <TxForm kind={modal.kind} tx={modal.tx} preset={modal.preset} onClose={onClose} />
        </Modal>
      );
    }
    case 'savings':
      return (
        <Modal title={modal.tx ? 'Editar movimiento de ahorro' : 'Cuenta de ahorro'} onClose={onClose}>
          <SavingsForm dir={modal.dir} tx={modal.tx} onClose={onClose} />
        </Modal>
      );
    case 'goal':
      return <Modal title="Meta de ahorro" onClose={onClose}><GoalForm onClose={onClose} /></Modal>;
    case 'pin':
      return <Modal title="Cambiar PIN" onClose={onClose}><PinForm onClose={onClose} /></Modal>;
    case 'onboarding':
      return <Modal title="¡Bienvenido! 👋" onClose={onClose}><OnboardingForm onClose={onClose} /></Modal>;
    case 'confirm':
      return <ConfirmModal {...modal} onClose={onClose} />;
  }
}
