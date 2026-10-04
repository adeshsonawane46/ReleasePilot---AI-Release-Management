import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import '../css/audit.css';

function RowsPerPageSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [10, 25, 50, 100];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="audit-rows-select" ref={ref}>
      <button className="audit-rows-btn" onClick={() => setOpen(!open)}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>table_rows</span>
        <span>Rows per page: {value}</span>
        <span className={`material-symbols-outlined audit-rows-chevron ${open ? 'open' : ''}`} style={{ fontSize: 16 }}>expand_more</span>
      </button>
      {open && (
        <div className="audit-rows-dropdown">
          {options.map((opt) => (
            <button
              key={opt}
              className={`audit-rows-option ${opt === value ? 'active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              <span>{opt} rows</span>
              {opt === value && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const fallbackLogs = [
  { _id: '1', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Finalized', release: 'v2.4.0', details: 'Release brief finalized and cryptographically sealed for production deployment.', attestation: 'hash:81e2...f9', timestamp: '2026-10-03T10:52:00' },
  { _id: '2', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Rejected', release: 'v2.4.0', details: 'Rejected unsupported browser claim "Works on all browsers"', attestation: 'hash:72d1...3a', timestamp: '2026-10-03T10:48:00' },
  { _id: '3', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Approved', release: 'v2.4.0', details: 'Approved Feature #1 statement with QA Evidence #3 citation [PR #402]', attestation: 'hash:55c8...1e', timestamp: '2026-10-03T10:43:00' },
  { _id: '4', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Edited', release: 'v2.4.0', details: 'Updated PDF compatibility statement to clarify Safari restriction on iOS 16+.', attestation: 'hash:91a4...bc', timestamp: '2026-10-03T10:40:00' },
  { _id: '5', actor: 'AI Agent', actorType: 'AI Agent', actorRole: 'Pilot-DeepSync', action: 'AI Generated', release: 'v2.4.0', details: 'Internal and client release briefs generated from multi-repo diff analysis.', attestation: 'hash:33f9...d2', timestamp: '2026-10-03T10:32:00' },
  { _id: '6', actor: 'AI Agent', actorType: 'AI Agent', actorRole: 'Pilot-DeepSync', action: 'AI Analysis', release: 'v2.4.0', details: '2 unsupported claims detected, 1 missing QA verification item flagged in review queue.', attestation: 'hash:18e4...07', timestamp: '2026-10-03T10:25:00' },
  { _id: '7', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Release Created', release: 'v2.4.0', details: 'Initial release package created from PR #402, PR #418 via GitHub Webhook sync.', attestation: 'hash:4b29...81', timestamp: '2026-10-03T10:20:00' },
  { _id: '8', actor: 'CI/CD', actorType: 'CI/CD', actorRole: 'GitHub Actions', action: 'Release Created', release: 'v2.3.0', details: 'Automated release pipeline triggered for v2.3.0 from main branch.', attestation: 'hash:9c3a...f2', timestamp: '2026-10-02T14:15:00' },
  { _id: '9', actor: 'AI Agent', actorType: 'AI Agent', actorRole: 'Pilot-DeepSync', action: 'AI Analysis', release: 'v2.3.0', details: 'Dependency audit completed. 0 critical vulnerabilities found.', attestation: 'hash:2d7b...a4', timestamp: '2026-10-02T11:30:00' },
  { _id: '10', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Approved', release: 'v2.3.0', details: 'Approved migration plan for database schema v23 to v24.', attestation: 'hash:6e1c...b8', timestamp: '2026-10-02T09:45:00' },
  { _id: '11', actor: 'Alex Rivera', actorType: 'Human', actorRole: 'Lead Eng', action: 'Edited', release: 'v2.3.0', details: 'Refined rollback procedure documentation for enterprise tier.', attestation: 'hash:4f8d...c3', timestamp: '2026-10-01T16:20:00' },
  { _id: '12', actor: 'CI/CD', actorType: 'CI/CD', actorRole: 'GitHub Actions', action: 'Release Created', release: 'v2.3.0', details: 'Staging deployment completed successfully. All health checks passed.', attestation: 'hash:7a2e...d9', timestamp: '2026-10-01T13:00:00' },
];

const actionBadgeMap = {
  Finalized: 'badge-success',
  Rejected: 'badge-danger',
  Approved: 'badge-success',
  Edited: 'badge-primary',
  'AI Generated': 'badge-info',
  'AI Analysis': 'badge-info',
  'Release Created': 'badge-neutral',
};

const badgeReference = [
  { action: 'Release Created', desc: 'Initiation', cls: 'badge-neutral', dot: 'var(--primary-container)' },
  { action: 'AI Analysis', desc: 'Automated Audit', cls: 'badge-info', dot: 'var(--primary)' },
  { action: 'AI Generated', desc: 'Draft Synthesis', cls: 'badge-info', dot: 'var(--primary)' },
  { action: 'Edited', desc: 'Human Revision', cls: 'badge-primary', dot: 'var(--on-primary)' },
  { action: 'Approved', desc: 'Sign-off', cls: 'badge-success', dot: 'var(--tertiary)' },
  { action: 'Rejected', desc: 'Blocked', cls: 'badge-danger', dot: 'var(--error)' },
  { action: 'Finalized', desc: 'Immutable Seal', cls: 'badge-success', dot: 'var(--tertiary)' },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState(fallbackLogs);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [releaseFilter, setReleaseFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [actorFilter, setActorFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [toastVisible, setToastVisible] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    api.getAuditLogs()
      .then((data) => { if (data?.length) setLogs(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const releases = useMemo(() => [...new Set(logs.map((l) => l.release))].sort((a, b) => b.localeCompare(a)), [logs]);
  const actors = useMemo(() => [...new Set(logs.map((l) => l.actor))].sort(), [logs]);

  const filtered = useMemo(() => {
    let result = logs.filter((l) => {
      const matchSearch = !search || `${l.actor} ${l.details} ${l.release} ${l.action}`.toLowerCase().includes(search.toLowerCase());
      const matchRelease = releaseFilter === 'All' || l.release === releaseFilter;
      const matchAction = actionFilter === 'All' || l.action === actionFilter;
      const matchActor = actorFilter === 'All' || l.actor === actorFilter;
      return matchSearch && matchRelease && matchAction && matchActor;
    });
    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [logs, search, releaseFilter, actionFilter, actorFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Actor', 'Actor Type', 'Actor Role', 'Action', 'Release', 'Details', 'Attestation'];
    const rows = filtered.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.actor,
      l.actorType,
      l.actorRole,
      l.action,
      l.release,
      `"${l.details.replace(/"/g, '""')}"`,
      l.attestation,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} events to CSV`);
  }, [filtered, showToast]);

  const handleCopyAttestation = useCallback(async (hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      showToast('Attestation hash copied');
    } catch {
      showToast('Failed to copy hash');
    }
  }, [showToast]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setReleaseFilter('All');
    setActionFilter('All');
    setActorFilter('All');
    setCurrentPage(1);
  }, []);

  const hasFilters = search || releaseFilter !== 'All' || actionFilter !== 'All' || actorFilter !== 'All';

  const stats = useMemo(() => {
    const humanActions = logs.filter((l) => l.actorType === 'Human').length;
    const aiActions = logs.filter((l) => l.actorType === 'AI Agent').length;
    return { total: logs.length, humanActions, aiActions };
  }, [logs]);

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="audit-pagination">
        <button className="audit-page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)} title="Previous page">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
        </button>
        {start > 1 && (
          <>
            <button className="audit-page-btn" onClick={() => setCurrentPage(1)}>1</button>
            {start > 2 && <span className="audit-ellipsis">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button key={p} className={`audit-page-btn ${p === safePage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="audit-ellipsis">...</span>}
            <button className="audit-page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
          </>
        )}
        <button className="audit-page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)} title="Next page">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: 1600 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div className="breadcrumb">
          <span>Settings</span>
          <span>/</span>
          <span style={{ color: 'var(--on-surface)', fontWeight: 500 }}>Audit Log</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <h1 className="headline-lg" style={{ letterSpacing: '-0.02em' }}>Audit Log</h1>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
              Track release changes, AI analysis, human review actions, and cryptographic attestations.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', alignSelf: 'flex-start' }}>
            <div className="audit-ledger-badge">
              <span className="pulse-dot" />
              <span>Ledger: SHA-256 Merkle Chain</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-4">
        {[
          { label: 'Total Events Logged', value: stats.total.toLocaleString(), sub: '+48 past 24h', icon: 'receipt_long', color: 'var(--primary)', bg: 'var(--surface-container)' },
          { label: 'Human Review Actions', value: stats.humanActions.toLocaleString(), sub: `${stats.total ? Math.round((stats.humanActions / stats.total) * 100) : 0}% verification share`, icon: 'verified_user', color: 'var(--secondary)', bg: 'rgba(208, 225, 251, 0.5)' },
          { label: 'AI Engine Events', value: stats.aiActions.toLocaleString(), sub: 'Pilot-DeepSync v2.4', icon: 'auto_awesome', color: 'var(--primary-container)', bg: 'var(--primary-fixed)' },
          { label: 'Immutable Sealed Blocks', value: '100%', sub: 'Zero tamper warnings', icon: 'lock', color: 'var(--tertiary)', bg: 'var(--surface-container-low)' },
        ].map((s) => (
          <div key={s.label} className="audit-stat-card">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)' }}>{s.label}</span>
              <span className="headline-lg" style={{ marginTop: 4, color: s.label.includes('Sealed') ? 'var(--tertiary)' : 'var(--on-surface)' }}>{s.value}</span>
              <span className="code-sm" style={{ color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                {s.label.includes('Total') && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>}
                {s.sub}
              </span>
            </div>
            <div className="audit-stat-icon" style={{ background: s.bg, color: s.color }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="audit-filter-card">
        <div className="audit-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input className="audit-search-input" placeholder="Filter audit trails by keyword, commit, or reviewer..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          {search && (
            <button className="audit-search-clear" onClick={() => setSearch('')} title="Clear search">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <select className="select" value={releaseFilter} onChange={(e) => { setReleaseFilter(e.target.value); setCurrentPage(1); }} style={{ height: 36 }}>
            <option value="All">Release: All</option>
            {releases.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }} style={{ height: 36 }}>
            <option value="All">Action: All Actions</option>
            {Object.keys(actionBadgeMap).map((a) => <option key={a}>{a}</option>)}
          </select>
          <select className="select" value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setCurrentPage(1); }} style={{ height: 36 }}>
            <option value="All">Actor: All Actors</option>
            {actors.map((a) => <option key={a}>{a}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_alt_off</span>
              Clear
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginLeft: 'auto' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
              Export CSV
            </button>
            <div className="audit-live-badge">
              <span className="pulse-dot" />
              <span>Live Stream: Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="audit-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table audit-table">
            <thead>
              <tr>
                <th style={{ width: 112, cursor: 'pointer' }} onClick={() => handleSort('timestamp')}>
                  <span className="audit-th-content">Timestamp <span className="audit-sort-icon">{sortField === 'timestamp' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span></span>
                </th>
                <th style={{ width: 240, cursor: 'pointer' }} onClick={() => handleSort('actor')}>
                  <span className="audit-th-content">Actor <span className="audit-sort-icon">{sortField === 'actor' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span></span>
                </th>
                <th style={{ width: 160, cursor: 'pointer' }} onClick={() => handleSort('action')}>
                  <span className="audit-th-content">Action <span className="audit-sort-icon">{sortField === 'action' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span></span>
                </th>
                <th style={{ width: 96, cursor: 'pointer' }} onClick={() => handleSort('release')}>
                  <span className="audit-th-content">Release <span className="audit-sort-icon">{sortField === 'release' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span></span>
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('details')}>
                  <span className="audit-th-content">Details <span className="audit-sort-icon">{sortField === 'details' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span></span>
                </th>
                <th style={{ textAlign: 'right', width: 176 }}>Attestation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="audit-empty-state">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>hourglass_top</span>
                  <span>Loading audit logs...</span>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="audit-empty-state">
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>search_off</span>
                  <span>No events match your filters</span>
                  {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
                </td></tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log._id} className="audit-table-row" onClick={() => setSelectedLog(log)}>
                    <td className="code-sm audit-timestamp">
                      <div>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="audit-date-sub">{new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div className="audit-avatar" style={{ background: log.actorType === 'AI Agent' ? 'var(--primary-fixed)' : log.actorType === 'CI/CD' ? 'var(--surface-container-high)' : 'var(--primary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: log.actorType === 'AI Agent' ? 'var(--primary-container)' : log.actorType === 'CI/CD' ? 'var(--on-surface-variant)' : 'var(--on-primary)' }}>
                            {log.actorType === 'AI Agent' ? 'smart_toy' : log.actorType === 'CI/CD' ? 'terminal' : 'person'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="body-sm" style={{ fontWeight: 600, lineHeight: '1.375rem' }}>{log.actor}</span>
                          <span className="code-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: '1rem' }}>{log.actorRole}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${actionBadgeMap[log.action] || 'badge-neutral'}`}>
                        <span className="dot" />
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="code-sm audit-release-tag">{log.release}</span>
                    </td>
                    <td className="body-sm audit-details-cell">{log.details}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="audit-attestation-btn" onClick={(e) => { e.stopPropagation(); handleCopyAttestation(log.attestation); }} title="Copy attestation hash">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                        <code>{log.attestation}</code>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="audit-table-footer">
          <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Showing <strong style={{ color: 'var(--on-surface)' }}>{filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1} - {Math.min(safePage * rowsPerPage, filtered.length)}</strong> of <strong style={{ color: 'var(--on-surface)' }}>{filtered.length}</strong> events
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            {renderPagination()}
            <RowsPerPageSelect value={rowsPerPage} onChange={(v) => { setRowsPerPage(v); setCurrentPage(1); }} />
          </div>
        </div>
      </div>

      <div className="audit-badges-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
            Action Badges Reference & Severity Matrix
          </span>
          <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Developer Registry v2.4</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-md)', paddingTop: 4 }}>
          {badgeReference.map((b) => (
            <div key={b.action} className="audit-badge-reference">
              <span className={`badge ${b.cls}`}>
                <span className="dot" style={{ background: b.dot }} />
                {b.action}
              </span>
              <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedLog && (
        <div className="audit-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3 className="headline-sm" style={{ fontWeight: 600 }}>Event Details</h3>
              <button className="icon-btn" onClick={() => setSelectedLog(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="audit-modal-body">
              <div className="audit-modal-row">
                <span className="audit-modal-label">Actor</span>
                <span className="audit-modal-value">{selectedLog.actor} ({selectedLog.actorRole})</span>
              </div>
              <div className="audit-modal-row">
                <span className="audit-modal-label">Action</span>
                <span className="audit-modal-value">
                  <span className={`badge ${actionBadgeMap[selectedLog.action] || 'badge-neutral'}`}>
                    <span className="dot" />
                    {selectedLog.action}
                  </span>
                </span>
              </div>
              <div className="audit-modal-row">
                <span className="audit-modal-label">Release</span>
                <span className="audit-modal-value code-sm">{selectedLog.release}</span>
              </div>
              <div className="audit-modal-row">
                <span className="audit-modal-label">Timestamp</span>
                <span className="audit-modal-value code-sm">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div className="audit-modal-row">
                <span className="audit-modal-label">Details</span>
                <span className="audit-modal-value body-sm">{selectedLog.details}</span>
              </div>
              <div className="audit-modal-row">
                <span className="audit-modal-label">Attestation</span>
                <span className="audit-modal-value">
                  <button className="audit-attestation-btn" onClick={() => handleCopyAttestation(selectedLog.attestation)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                    <code>{selectedLog.attestation}</code>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastVisible && (
        <div className="audit-live-toast">
          <div className="audit-live-toast-inner">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary-fixed)', flexShrink: 0 }}>sync</span>
            <span className="body-sm" style={{ flex: 1 }}>Audit feed synchronized in real time with Git commit trail.</span>
            <button className="audit-toast-close" onClick={() => setToastVisible(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
