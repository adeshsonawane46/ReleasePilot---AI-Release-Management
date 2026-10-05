import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/versions', label: 'Versions', icon: 'inventory_2' },
  { to: '/create', label: 'Create Release', icon: 'add_circle' },
  { to: '/analysis', label: 'AI Analysis', icon: 'psychology' },
  { to: '/briefs', label: 'Release Briefs', icon: 'description' },
  { to: '/compare', label: 'Compare', icon: 'compare_arrows' },
  { to: '/review', label: 'Review Queue', icon: 'rate_review' },
  { to: '/final-brief', label: 'Final Brief', icon: 'verified' },
  { to: '/audit', label: 'Audit Log', icon: 'receipt_long' },
];

const MOBILE_QUERY = '(max-width: 1024px)';

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close the drawer on navigation and whenever we grow past the mobile breakpoint.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => {
      if (!e.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const activeItem =
    navItems.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))) ||
    navItems[0];

  return (
    <div className="app-shell">
      {navOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className={`sidebar${navOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
            <rect width="32" height="32" rx="8" fill="#4338CA" />
            <path d="M7 16L15 8V13H24C24.5523 13 25 13.4477 25 14V18C25 18.5523 24.5523 19 24 19H15V24L7 16Z" fill="white" opacity="0.95" />
            <circle cx="21" cy="16" r="2.5" fill="#38BDF8" />
            <path d="M12 16L16 12V20L12 16Z" fill="#EEF2FF" />
          </svg>
          <span className="sidebar-label headline-sm">ReleasePilot</span>
          <button
            type="button"
            className="icon-btn sidebar-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer sidebar-label">
          <div>Pilot-DeepSync v4</div>
          <div style={{ marginTop: 4 }}>Production Ring 0</div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="topbar-title">{activeItem.label}</span>
          <span className="topbar-spacer" />
        </header>
        <Outlet />
      </div>
    </div>
  );
}