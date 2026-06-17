import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const DPO_EMAIL = 'dataprotection@manchester.ac.uk';
const FSE_EMAIL = 'fse-engagement@manchester.ac.uk';
const UOM_DP = 'https://www.manchester.ac.uk/about/privacy-information/data-protection/';

/** Privacy & data-protection notice (F1). Plain-English, audience-first. This is
 *  a DRAFT for the University's data-protection sign-off — the real go/no-go gate
 *  for the pilot — so it states what HubLab intends to collect and why, without
 *  claiming compliance. Final wording, lawful bases and retention periods are to
 *  be confirmed with the FSE team and the University DPO. */
export function Privacy() {
  useDocumentTitle('Privacy and data protection');
  return (
    <section className="section section--paper">
      <div className="container legal">
        <p className="pill">Privacy</p>
        <h1>Privacy and data protection</h1>

        <div className="notice" role="note" style={{ marginBottom: 'var(--s-5)' }}>
          <strong>Draft for review.</strong> This is a prototype. The notice below sets out what
          HubLab plans to collect and why; it still needs the University's data-protection sign-off
          before the pilot goes live, so please don't rely on it as final.
        </div>

        <p>
          HubLab is run by the Faculty of Science and Engineering at the University of Manchester.
          When you use this site we try to collect as little personal information as we can, and to
          be clear about what we do collect and why. This notice sits alongside the University's
          central{' '}
          <a href={UOM_DP} target="_blank" rel="noopener noreferrer">data protection information</a>,
          which governs how the University handles personal data.
        </p>

        <h2>What we collect, and why</h2>
        <p>There are three places HubLab might collect information about you:</p>
        <ul className="legal__list">
          <li><strong>Our mailing list.</strong> If you sign up, we keep your email address and the
            topics you choose, so we can send occasional updates about things you're interested in.
            You can change your topics or unsubscribe at any time.</li>
          <li><strong>Submitting content.</strong> If you submit an event, activity or resource, we
            keep your name, email and (if you give it) your department, so the team can review what
            you sent and get back to you about it.</li>
          <li><strong>How the site is used.</strong> We keep simple counts — like how many times
            something was viewed or found useful — to understand what's helpful. These counts aren't
            tied to your identity.</li>
        </ul>
        <p>We don't sell your information, and HubLab doesn't show advertising. We only use what you
          give us for the purpose you gave it for.</p>

        <h2>Children and young people</h2>
        <p>
          FunLab and FutureLab are aimed at children and young people, often alongside a parent,
          carer or teacher. We take extra care here. We don't knowingly collect more information
          about a child than we need, and where a sign-up or submission involves someone under 18 we
          expect a parent, carer or teacher to be involved and to consent. If you believe we hold
          information about a child that shouldn't be here, please contact us and we'll remove it.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep content (events, activities and resources) only while it's relevant — each item
          has an expiry date, after which it's removed from public view. We keep mailing-list details
          until you unsubscribe, and submission contact details only as long as needed to handle and
          record the submission. Final retention periods will be confirmed as part of sign-off.
        </p>

        <h2>Where your data is held</h2>
        <p>
          For the pilot, HubLab is intended to store personal data within the UK or EU. Confirming
          this — including the hosting region for the database and any email provider — is part of
          the data-protection sign-off before launch.
        </p>

        <h2>Who else is involved</h2>
        <p>
          To run the service we use a small number of trusted providers: for hosting the site and
          its database, and for sending mailing-list emails. We share only what each needs to do its
          job. If you choose to add an event to your own calendar, that uses your calendar provider
          (for example Google) under their terms — we don't send them anything ourselves.
        </p>

        <h2>Your choices and your rights</h2>
        <p>
          You can ask to see what we hold about you, to correct it, or to have it deleted, and you
          can unsubscribe from the mailing list at any time. You also have rights under UK data
          protection law, including the right to complain to the Information Commissioner's Office.
        </p>
        <p>
          To exercise any of these, or if you have a question about your information:
        </p>
        <ul className="legal__list">
          <li>About HubLab specifically — email the team at{' '}
            <a href={`mailto:${FSE_EMAIL}`}>{FSE_EMAIL}</a>.</li>
          <li>About your rights or a formal request — the University's Data Protection Officer at{' '}
            <a href={`mailto:${DPO_EMAIL}`}>{DPO_EMAIL}</a>, and the University's{' '}
            <a href={UOM_DP} target="_blank" rel="noopener noreferrer">data protection information</a>.</li>
        </ul>

        <p style={{ marginTop: 'var(--s-6)' }}>
          <Link to="/" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>
            Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
