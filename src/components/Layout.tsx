import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SUB_BRAND_ORDER, SUB_BRANDS } from '../data/vocabularies';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  color: 'var(--c-paper)',
  opacity: isActive ? 1 : 0.78,
  padding: 'var(--s-2) var(--s-3)',
  borderRadius: 'var(--r-pill)',
  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
});

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // On navigation, return to the top and close the mobile menu.
  useEffect(() => { window.scrollTo(0, 0); setMenuOpen(false); }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header" style={{ background: 'var(--c-canvas)', borderBottom: '1px solid var(--c-line-dark)' }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)', paddingBlock: 'var(--s-4)' }}
        >
          <Link to="/" className="brandlink" aria-label="HubLab home" title="HubLab home" style={{ display: 'inline-flex' }}>
            <img src="./brand/hublab-wordmark.png" alt="HubLab" style={{ height: 44, width: 'auto' }} />
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '✕ Close' : '☰ Menu'}
          </button>

          <nav id="primary-nav" aria-label="Primary" className={`primary-nav${menuOpen ? ' is-open' : ''}`}>
            <NavLink to="/" style={navLinkStyle} end>Home</NavLink>
            <NavLink to="/find" style={navLinkStyle}>Find stuff</NavLink>
            <NavLink to="/calendar" style={navLinkStyle}>What's on</NavLink>
            {SUB_BRAND_ORDER.map(sb => (
              <NavLink key={sb} to={`/${sb}`} style={navLinkStyle}>{SUB_BRANDS[sb].label}</NavLink>
            ))}
            <NavLink to="/about" style={navLinkStyle}>About</NavLink>
            <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink>
          </nav>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="container" style={{ paddingBlock: 'var(--s-7)' }}>
          <Link to="/" className="brandlink" aria-label="HubLab home" title="HubLab home" style={{ display: 'inline-flex', textDecoration: 'none' }}>
            <img src="./brand/hublab-wordmark.png" alt="HubLab" style={{ height: 40, width: 'auto' }} />
          </Link>
          <p style={{ opacity: 0.8, maxWidth: 'var(--maxw-text)', marginTop: 'var(--s-3)' }}>
            Bringing science and engineering to life. A University of Manchester, Faculty of
            Science and Engineering project. Prototype — content is illustrative.
          </p>
          <p style={{ opacity: 0.8 }}>
            <Link to="/about" style={{ color: 'var(--c-paper)' }}>About HubLab</Link>
            {' · '}
            Email: <a href="mailto:fse-engagement@manchester.ac.uk">fse-engagement@manchester.ac.uk</a>
          </p>
          <nav className="footer-legal" aria-label="Legal and privacy">
            <Link to="/privacy">Privacy &amp; data protection</Link>
            <a href="https://www.manchester.ac.uk/about/privacy-information/data-protection/" target="_blank" rel="noopener noreferrer">University data protection</a>
            <a href="https://www.manchester.ac.uk/about/privacy-information/" target="_blank" rel="noopener noreferrer">University privacy information</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
