import { NavLink, Outlet } from 'react-router-dom';

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

export default function Layout() {
  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="32" height="32">
            <rect width="32" height="32" rx="8" fill="#4338CA" />
            <path d="M7 16L15 8V13H24C24.5523 13 25 13.4477 25 14V18C25 18.5523 24.5523 19 24 19H15V24L7 16Z" fill="white" opacity="0.95" />
            <circle cx="21" cy="16" r="2.5" fill="#38BDF8" />
            <path d="M12 16L16 12V20L12 16Z" fill="#EEF2FF" />
          </svg>
          <span className="sidebar-label headline-sm">ReleasePilot</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer sidebar-label">
          <div>Pilot-DeepSync v4</div>
          <div style={{ marginTop: 4 }}>Production Ring 0</div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
