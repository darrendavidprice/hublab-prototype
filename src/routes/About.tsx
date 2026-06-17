import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const FSE_EMAIL = 'fse-engagement@manchester.ac.uk';

/** About HubLab (A2). Plain-English, audience-first. Copy is paraphrased from the
 *  FSE engagement about-us material (heritage, mission, the "spark of fascination"
 *  framing) — not lifted verbatim. Event photography sits in overlap-safe image+text
 *  splits (.mediaband); no text ever sits over a photo. */
export function About() {
  useDocumentTitle('About');
  return (
    <>
      <section className="section section--paper">
        <div className="container legal">
          <p className="pill">About</p>
          <h1>Opening doors to science and engineering, for everyone</h1>
          <p className="section__lead" style={{ marginTop: 'var(--s-4)' }}>
            HubLab is how the University of Manchester's Faculty of Science and Engineering
            shares its work with the world beyond the campus. One place to find events,
            activities, videos and the chance to meet the people who do science for a living —
            whatever your age and wherever you're starting from.
          </p>
        </div>
      </section>

      {/* What we do — image + text split */}
      <section className="section section--tint">
        <div className="container">
          <div className="mediaband">
            <div className="mediaband__media">
              <img
                src="./brand/photos/event-simulator.jpg"
                alt="A grinning child sits strapped into a racing-style simulator seat holding the controls, with other children watching behind."
                loading="lazy"
                width={800}
                height={533}
              />
            </div>
            <div className="mediaband__text">
              <span className="section__eyebrow">What we do</span>
              <h2 className="section__title">Hands-on, jargon-free, and out where you are</h2>
              <p>
                We take real research and engineering out of the labs and into shopping centres,
                schools, festivals and living rooms. That might mean a robot to meet, a simulator
                to try, an experiment to run at the kitchen table, or a plain-English explainer of
                what our researchers are working on right now.
              </p>
              <p>
                Nothing here needs a science background. The aim is simple: give everyone a way in,
                and the chance to ask the questions they've always wondered about.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The spark — image + text split (reversed) */}
      <section className="section section--paper">
        <div className="container">
          <div className="mediaband mediaband--reverse">
            <div className="mediaband__media">
              <img
                src="./brand/photos/event-robot-dog.jpg"
                alt="A young child grins as a HubLab team member kneels beside them to watch a four-legged walking robot at a family event."
                loading="lazy"
                width={800}
                height={533}
              />
            </div>
            <div className="mediaband__text">
              <span className="section__eyebrow">Why it matters</span>
              <h2 className="section__title">Every scientist started with a spark</h2>
              <p>
                For a lot of people, a fascination with how the world works begins with a single
                moment — a question, a demonstration, a "how does that even work?". We want to
                create as many of those moments as we can, for as many people as we can.
              </p>
              <p>
                Building on years of large-scale public events and the University's ScienceX
                heritage, HubLab brings that work together under one roof so it's easy to find,
                whoever you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three labs, one home */}
      <section className="section section--tint">
        <div className="container legal">
          <span className="section__eyebrow">Find your corner</span>
          <h2 className="section__title">Three labs, one home</h2>
          <p>
            Everything lives here together, but each lab is tuned to who it's for — and plenty of
            things show up in more than one:
          </p>
          <ul className="legal__list">
            <li><strong>FunLab</strong> — hands-on science for young children and the grown-ups who
              love them.</li>
            <li><strong>FutureLab</strong> — for ages 11 and up who want to see where science and
              engineering could take them.</li>
            <li><strong>LifeLab</strong> — talks, deep dives and plain-English explainers for
              curious adults.</li>
          </ul>
          <p style={{ marginTop: 'var(--s-5)' }}>
            <Link to="/find" className="btn btn--primary">Find stuff to do</Link>{' '}
            <Link to="/calendar" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>See what's on</Link>
          </p>
        </div>
      </section>

      {/* Get in touch */}
      <section className="section section--paper">
        <div className="container legal">
          <span className="section__eyebrow">Get in touch</span>
          <h2 className="section__title">Work with us, or just say hello</h2>
          <p>
            Are you part of the Faculty with an event, activity or resource to share? Or a teacher,
            parent or community group who'd like us to get involved? We'd love to hear from you.
          </p>
          <p>
            Email the engagement team at <a href={`mailto:${FSE_EMAIL}`}>{FSE_EMAIL}</a>.
          </p>
          <p style={{ marginTop: 'var(--s-6)' }}>
            <Link to="/" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>
              Back to home
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
