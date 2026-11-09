import { useEffect, useRef, useState } from 'react';
import { LOCKOUT_MS, MAX_PIN_ATTEMPTS } from '../lib/constants';
import { uid } from '../lib/format';
import { hashPin, pinAlgo, verifyPin } from '../lib/pin';
import { clearDB } from '../lib/storage';
import { useApp } from '../state';
import { Icon } from './Icon';

type Stage = 'create' | 'confirm' | 'unlock';

const COPY: Record<Stage, { title: string; sub: string }> = {
  create: { title: 'Bienvenido a AdminPay', sub: 'Crea un PIN de 4 dígitos' },
  confirm: { title: 'Confirma tu PIN', sub: 'Escríbelo otra vez' },
  unlock: { title: 'AdminPay', sub: 'Ingresa tu PIN' },
};

export function LockScreen({ onUnlock }: { onUnlock: (isNew: boolean) => void }) {
  const { db, setDB, openModal } = useApp();
  const [stage, setStage] = useState<Stage>(db.pin ? 'unlock' : 'create');
  const [buffer, setBuffer] = useState('');
  const [first, setFirst] = useState('');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<'' | 'error' | 'ok'>('');
  const [now, setNow] = useState(Date.now());
  const bufRef = useRef('');
  const busy = useRef(false);
  const attempts = useRef(0);

  const lockedOut = stage === 'unlock' && now < db.lockUntil;
  const secondsLeft = Math.ceil((db.lockUntil - now) / 1000);

  useEffect(() => {
    if (!(db.lockUntil > Date.now())) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [db.lockUntil]);

  const setBuf = (v: string) => {
    bufRef.current = v;
    setBuffer(v);
  };

  const fail = (m: string) => {
    setStatus('error');
    setMsg(m);
    setTimeout(() => {
      setStatus('');
      setBuf('');
      busy.current = false;
    }, 450);
  };

  const submit = async (pin: string) => {
    if (stage === 'create') {
      setFirst(pin);
      setStage('confirm');
      setBuf('');
      busy.current = false;
      return;
    }
    if (stage === 'confirm') {
      if (pin !== first) {
        setStage('create');
        setFirst('');
        fail('Los PIN no coinciden. Créalo de nuevo.');
        return;
      }
      const algo = pinAlgo();
      const salt = uid();
      const hash = await hashPin(pin, salt, algo);
      setDB((d) => ({ ...d, pin: { salt, hash, algo } }));
      setStatus('ok');
      setTimeout(() => onUnlock(true), 250);
      return;
    }
    if (!db.pin) return;
    if (await verifyPin(pin, db.pin)) {
      attempts.current = 0;
      setStatus('ok');
      setTimeout(() => onUnlock(false), 200);
      return;
    }
    attempts.current++;
    if (attempts.current >= MAX_PIN_ATTEMPTS) {
      attempts.current = 0;
      const until = Date.now() + LOCKOUT_MS;
      setDB((d) => ({ ...d, lockUntil: until }));
      setNow(Date.now());
      fail('Demasiados intentos fallidos.');
    } else {
      const left = MAX_PIN_ATTEMPTS - attempts.current;
      fail(`PIN incorrecto · ${left} ${left === 1 ? 'intento' : 'intentos'} más`);
    }
  };

  const press = (k: string) => {
    if (busy.current || lockedOut) return;
    if (k === 'back') {
      setBuf(bufRef.current.slice(0, -1));
      return;
    }
    if (bufRef.current.length >= 4) return;
    const next = bufRef.current + k;
    setBuf(next);
    setMsg('');
    if (next.length === 4) {
      busy.current = true;
      setTimeout(() => void submit(next), 120);
    }
  };

  // Siempre la versión más reciente de `press` para el listener del teclado.
  const pressRef = useRef(press);
  pressRef.current = press;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.modal-root.open')) return;
      if (/^\d$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === 'Backspace') pressRef.current('back');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const forgot = () =>
    openModal({
      type: 'confirm',
      title: '¿Olvidaste tu PIN?',
      text: 'El PIN no se puede recuperar. La única opción es borrar todos los datos de este dispositivo y empezar de cero. Esta acción no se puede deshacer.',
      ok: 'Borrar todo y empezar',
      danger: true,
      onConfirm: () => {
        clearDB();
        location.reload();
      },
    });

  const copy = COPY[stage];
  const message = lockedOut ? `Bloqueado. Espera ${secondsLeft}s para intentar de nuevo.` : msg;

  return (
    <section className="lock" aria-label="Bloqueo con PIN">
      <div className="lock-card">
        <div className="brand-mark big" aria-hidden="true">
          <Icon name="logo" />
        </div>
        <h1 className="lock-title">{copy.title}</h1>
        <p className="lock-sub">{copy.sub}</p>
        <div className={`pin-dots ${status} ${status === 'error' ? 'shake' : ''}`} aria-label={`${buffer.length} de 4 dígitos`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < buffer.length ? 'on' : ''} />
          ))}
        </div>
        <p className={`lock-msg ${lockedOut ? 'info' : ''}`} role="alert">
          {message}
        </p>
        <div className="keypad" aria-disabled={lockedOut}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button key={k} onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <span />
          <button onClick={() => press('0')}>0</button>
          <button className="key-icon" onClick={() => press('back')} aria-label="Borrar">
            <Icon name="back" />
          </button>
        </div>
        {stage === 'unlock' && (
          <button className="link-btn" onClick={forgot}>
            ¿Olvidaste tu PIN?
          </button>
        )}
        {stage === 'confirm' && (
          <button
            className="link-btn"
            onClick={() => {
              setStage('create');
              setFirst('');
              setBuf('');
            }}
          >
            Volver a empezar
          </button>
        )}
      </div>
    </section>
  );
}
