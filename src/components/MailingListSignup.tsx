import { useEffect, useId, useState } from 'react';
import { SUB_BRAND_ORDER, SUB_BRANDS } from '../data/vocabularies';
import type { SubBrand } from '../data/types';

/** Mailing-list signup UI.
 *  The brief keeps the list itself with the University's email provider (ESP),
 *  so this is the front-of-house form only: it collects an address and the
 *  tag preferences that become ESP groups/segments later (see
 *  WORDPRESS_MAPPING.md). Nothing is sent in the prototype — on submit we
 *  validate and show the confirmation state the real flow would show. */
export function MailingListSignup({ initialPrefs = [] }: { initialPrefs?: SubBrand[] } = {}) {
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<SubBrand[]>(initialPrefs);
  const [whatsOn, setWhatsOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // React reuses this component instance across sub-brand navigations (only the
  // prop changes), so seeding state once at mount would leave the first lab's
  // pre-selection stuck. Re-seed when the incoming pre-selection changes.
  const initialKey = initialPrefs.join(',');
  useEffect(() => {
    setPrefs(initialPrefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const togglePref = (id: SubBrand) =>
    setPrefs(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const valid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid(email)) {
      setError('Enter an email address so we know where to send updates.');
      return;
    }
    setError(null);
    setDone(true);
  }

  if (done) {
    const chosen = prefs.length ? prefs.map(p => SUB_BRANDS[p].label).join(', ') : 'everything';
    return (
      <div className="signup">
        <h2>You're on the list</h2>
        <div className="signup__success" role="status">
          <p style={{ marginBottom: 'var(--s-2)' }}>
            We'll send updates to <strong>{email}</strong> about <strong>{chosen}</strong>
            {whatsOn ? ', including upcoming events.' : '.'}
          </p>
          <p style={{ margin: 0, opacity: 0.85 }}>
            In the live site this hands off to the University's email service. For now,
            nothing has actually been sent — this is the prototype showing the flow.
          </p>
        </div>
        <p style={{ marginTop: 'var(--s-4)' }}>
          <button type="button" className="btn btn--ghost" onClick={() => { setDone(false); setEmail(''); }}>
            Sign up another address
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="signup">
      <h2>Get the good stuff in your inbox</h2>
      <p className="signup__lead">
        A short, occasional email with new activities, events near you, and what our
        scientists are working on. Pick what you'd like to hear about — change it any time.
      </p>

      <form className="signup__form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor={emailId}>Email address</label>
          <input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${emailId}-err` : undefined}
          />
          {error && <span className="field-error" id={`${emailId}-err`}>{error}</span>}
        </div>

        <fieldset className="prefs">
          <legend>What would you like to hear about?</legend>
          <div className="prefs__opts">
            {SUB_BRAND_ORDER.map(id => (
              <label key={id} className="pref-opt">
                <input type="checkbox" checked={prefs.includes(id)} onChange={() => togglePref(id)} />
                <span>{SUB_BRANDS[id].label} — {SUB_BRANDS[id].audience}</span>
              </label>
            ))}
            <label className="pref-opt">
              <input type="checkbox" checked={whatsOn} onChange={() => setWhatsOn(v => !v)} />
              <span>Events &amp; what's on</span>
            </label>
          </div>
          <p className="signup__note">Leave the topics unticked to hear about everything.</p>
        </fieldset>

        <button type="submit" className="btn btn--primary btn--lg" style={{ background: '#fff', color: 'var(--c-hublab)', justifySelf: 'start' }}>
          Sign me up
        </button>
      </form>
    </div>
  );
}
