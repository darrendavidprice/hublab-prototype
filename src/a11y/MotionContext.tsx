import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Motion preference.
 * - 'system'  : follow the OS prefers-reduced-motion setting (default)
 * - 'full'    : user explicitly wants animation on
 * - 'reduce'  : user explicitly wants animation off
 *
 * The resolved value is written to <html data-motion="..."> so CSS in
 * global.css can neutralise transitions/animations and components can
 * read it to pause autoplaying media. This satisfies the brief's
 * "need to be able to turn off automatic animations" requirement with
 * an explicit control, on top of honouring the OS setting.
 */
type MotionPref = 'system' | 'full' | 'reduce';
type Resolved = 'full' | 'reduce';

interface MotionState {
  pref: MotionPref;
  resolved: Resolved;
  setPref: (p: MotionPref) => void;
  reduced: boolean;
}

const KEY = 'hublab.motionPref';
const MotionCtx = createContext<MotionState | null>(null);

function systemPrefersReduced(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<MotionPref>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as MotionPref | null;
    return saved ?? 'system';
  });
  const [sysReduced, setSysReduced] = useState<boolean>(systemPrefersReduced);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSysReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: Resolved =
    pref === 'system' ? (sysReduced ? 'reduce' : 'full') : pref;

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', resolved);
  }, [resolved]);

  const setPref = (p: MotionPref) => {
    setPrefState(p);
    try { localStorage.setItem(KEY, p); } catch { /* ignore */ }
  };

  return (
    <MotionCtx.Provider value={{ pref, resolved, setPref, reduced: resolved === 'reduce' }}>
      {children}
    </MotionCtx.Provider>
  );
}

export function useMotion(): MotionState {
  const ctx = useContext(MotionCtx);
  if (!ctx) throw new Error('useMotion must be used within MotionProvider');
  return ctx;
}
