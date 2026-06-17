import { useMotion } from '../a11y/MotionContext';

/** Lets anyone switch off automatic animations, regardless of OS setting.
 *  Implemented as a labelled radio group for clear screen-reader semantics. */
export function MotionToggle() {
  const { pref, setPref, reduced } = useMotion();
  return (
    <fieldset
      style={{
        border: '1px solid var(--c-line-dark)', borderRadius: 'var(--r-md)',
        padding: 'var(--s-3) var(--s-4)', margin: 0, color: 'var(--c-paper)',
      }}
    >
      <legend style={{ fontFamily: 'var(--font-display)', fontWeight: 600, padding: '0 var(--s-2)' }}>
        Animations {reduced ? '(off)' : '(on)'}
      </legend>
      <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
        {([
          ['system', 'Match my device'],
          ['full', 'On'],
          ['reduce', 'Off'],
        ] as const).map(([value, label]) => (
          <label key={value} style={{ display: 'inline-flex', gap: 'var(--s-2)', alignItems: 'center' }}>
            <input
              type="radio"
              name="motion-pref"
              value={value}
              checked={pref === value}
              onChange={() => setPref(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
