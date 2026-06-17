import { Link } from 'react-router-dom';
import { SUB_BRANDS } from '../data/vocabularies';
import type { SubBrand } from '../data/types';

/** The hero for a sub-brand page. Typographic and colour-led: a theme-coloured
 *  glow over the dark canvas, with the lab name and eyebrow set in the lab's
 *  own (light) colour so they stay high-contrast on the dark ground. Themed
 *  purely by the [data-lab] wrapper, so all three labs share one component and
 *  differ only by colour and copy. */
export function SubBrandHero({ subBrand, intro }: { subBrand: SubBrand; intro: string }) {
  const sb = SUB_BRANDS[subBrand];
  return (
    <section className="subhero" data-lab={subBrand} aria-labelledby="sub-h1">
      <div className="container subhero__inner">
        <p className="subhero__eyebrow">{sb.audience}</p>
        <h1 className="subhero__logo-h1" id="sub-h1">
          <img className="subhero__logo" src={`./brand/labs/${subBrand}-colour.png`} alt={sb.label} width={480} height={240} />
        </h1>
        <p className="subhero__tagline">{sb.tagline}.</p>
        <p className="subhero__lead">{intro}</p>
        <div className="subhero__actions">
          <Link to={`/find?aud=${subBrand}`} className="btn btn--primary btn--lg">Browse everything</Link>
          <Link to="/calendar" className="btn btn--ghost btn--lg">See what's on</Link>
        </div>
      </div>
    </section>
  );
}
