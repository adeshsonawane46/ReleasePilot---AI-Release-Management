import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import '../css/versions.css';

const fallbackVersions = [
  { _id: '1', version: 'v2.4.0', name: 'Dashboard Improvements', branch: 'release/v2.4', commit: 'd98a2fe', status: 'Needs Review', changes: 13, reviewer: '— (Pending)', preserved: 'Oct 3, 2026', author: 'Alex Rivera', unsupported: 2 },
  { _id: '2', version: 'v2.3.0', name: 'Authentication Update', branch: 'release/v2.3', commit: '74fa90c', status: 'Approved', changes: 21, reviewer: 'Alex Rivera', preserved: 'Sep 20, 2026', author: 'Alex Rivera', unsupported: 0 },
  { _id: '3', version: 'v2.2.0', name: 'Performance Improvements', branch: 'release/v2.2', commit: 'a89c011', status: 'Approved', changes: 9, reviewer: 'Maria Chen', preserved: 'Aug 28, 2026', author: 'Maria Chen', unsupported: 0 },
  { _id: '4', version: 'v2.1.2', name: 'Security Patch & Hotfix', branch: 'hotfix/v2.1.2', commit: '3e41b98', status: 'Approved', changes: 4, reviewer: 'DevOps Team', preserved: 'Aug 14, 2026', author: 'DevOps Team', unsupported: 0 },
  { _id: '5', version: 'v2.0.0', name: 'Core Platform Architecture', branch: 'release/v2.0', commit: 'f9a21b4', status: 'Approved', changes: 44, reviewer: 'Sarah T.', preserved: 'Jul 10, 2026', author: 'Sarah T.', unsupported: 0 },
];

const revisions = [
  { revision: 'Revision 3', note: '"AI-generated statements reviewed (5 approved, 2 edited)"', actor: 'Alex Rivera', time: '10:48 AM', tag: 'PR #402', color: 'var(--primary-container)' },
  { revision: 'Revision 2', note: '"QA evidence updated with Firefox test matrix"', actor: 'QA Lead', time: '10:35 AM', tag: 'Matrix #19', color: 'var(--secondary-fixed-dim)' },
  { revision: 'Revision 1', note: '"Initial release package created from PR #402, #418"', actor: 'Alex Rivera', time: '10:20 AM', tag: 'Base Init', color: 'var(--surface-container-highest)' },
];

export default function ReleaseVersions() {
  const [versions, setVersions] = useState(fallbackVersions);
  const [selected, setSelected] = useState(fallbackVersions[0]);
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const showToast = useToast();

  const branches = useMemo(
    () => [...new Set(versions.map((v) => v.branch))].sort(),
    [versions]
  );

  const filtered = versions.filter((v) => {
    const matchesSearch = !search || `${v.version} ${v.name} ${v.reviewer}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || v.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleSelect = (v) => {
    setSelected(v);
    showToast(`Snapshot ${v.version} selected`);
  };

  const handleViewSnapshot = (v, e) => {
    if (e) e.stopPropagation();
    setSelected(v);
    setActiveSnapshot(v);
    showToast(`Viewing snapshot details for ${v.version}`);
  };

  const exportSnapshotJson = (v) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(v, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `release-snapshot-${v.version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported snapshot ${v.version} as JSON`);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: 1720 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div className="breadcrumb">
          <Link to="/">Releases</Link>
          <span>/</span>
          <span style={{ color: 'var(--on-surface)', fontWeight: 500 }}>Versions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', paddingTop: 'var(--space-xs)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <h1 className="headline-xl" style={{ letterSpacing: '-0.025em' }}>Release Versions</h1>
              <span className="badge badge-info" style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-fixed)' }}>{versions.length} Preserved Snapshots</span>
            </div>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>View preserved release snapshots and revision history.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Link to="/compare" className="btn btn-secondary" style={{ height: 36 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>difference</span>
              Compare Versions
            </Link>
            <Link to="/create" className="btn btn-primary" style={{ height: 36 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
              + New Release Draft
            </Link>
          </div>
        </div>
      </div>

      <div className="layout-grid" style={{ alignItems: 'start' }}>
        <div className="col-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="versions-filter-bar">
            <div className="versions-search-wrap">
              <span className="material-symbols-outlined">search</span>
              <input className="versions-search-input" placeholder="Search version, tag, PR, commit..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="versions-filters">
              <select
                className="select"
                style={{ height: 36 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All Snapshots</option>
                <option value="Approved">Status: Approved</option>
                <option value="Needs Review">Status: Needs Review</option>
              </select>
              <select
                className="select"
                style={{ height: 36 }}
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">Branch: All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>Branch: {b}</option>
                ))}
              </select>
              <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => showToast('Matrix reloaded')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              </button>
            </div>
          </div>

          <div className="versions-table-card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Release Name</th>
                    <th>Status</th>
                    <th>Changes</th>
                    <th>Reviewer</th>
                    <th>Preserved</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v._id} onClick={() => handleSelect(v)} style={{ cursor: 'pointer', background: selected._id === v._id ? 'rgba(226, 231, 255, 0.6)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected._id === v._id ? 'var(--primary-container)' : 'transparent' }} />
                          <span className="code-md" style={{ fontWeight: 600, color: selected._id === v._id ? 'var(--primary)' : 'inherit' }}>{v.version}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{v.name}</span></td>
                      <td><StatusBadge status={v.status} /></td>
                      <td><span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: selected._id === v._id ? 'var(--surface-container)' : 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>{v.changes} changes</span></td>
                      <td style={{ color: v.reviewer.includes('Pending') ? 'var(--outline)' : 'var(--on-surface)', fontStyle: v.reviewer.includes('Pending') ? 'italic' : 'normal' }}>{v.reviewer}</td>
                      <td className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>{v.preserved}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button className="btn btn-sm btn-primary" onClick={(e) => handleViewSnapshot(v, e)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                            View Snapshot
                          </button>
                          <button className="icon-btn" style={{ width: 30, height: 30, border: 'none', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); exportSnapshotJson(v); }} title="Export JSON">
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="versions-table-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="code-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--tertiary)' }}>lock</span>
                <span>All {versions.length} versions cryptographically sealed with Git SHA-256</span>
              </div>
              <span>Showing 1-{filtered.length} of {filtered.length} entries</span>
            </div>
          </div>

          <div className="versions-cadence-card">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: 20 }}>insights</span>
                <span className="headline-sm">Cadence & Version Drift Metrics</span>
              </div>
              <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Average Cycle: 19.4 Days</span>
            </div>
            <div className="grid grid-3" style={{ paddingTop: 'var(--space-xs)' }}>
              {[
                { label: 'Median Claims Per Release', value: '18.2', trend: '+12%', sub: 'Verified by AI engine' },
                { label: 'Review Bottleneck Index', value: '1.8d', trend: '-0.4d', sub: 'From PR merge to sign-off' },
                { label: 'Preservation Integrity', value: '100%', trend: 'Zero Tampering', sub: 'Signed by GPG 0x82C7', color: 'var(--primary)' },
              ].map((m) => (
                <div key={m.label} className="versions-metric-item">
                  <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                    <span className="headline-lg" style={{ fontWeight: 700, color: m.color || 'var(--on-surface)' }}>{m.value}</span>
                    <span className="code-sm" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{m.trend.startsWith('+') ? 'trending_up' : m.trend.startsWith('-') ? 'arrow_downward' : undefined}</span>
                      {m.trend}
                    </span>
                  </div>
                  <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>{m.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-side versions-side-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="versions-inspector">
            <div className="versions-inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Snapshot Inspector</span>
                <span className="badge badge-info" style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-fixed)', fontWeight: 600 }}>Current Target</span>
              </div>
              <h2 className="headline-md" style={{ marginTop: 4 }}>Release Version Snapshot: {selected.version}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="code-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
                <span>Preserved: {selected.preserved} - 10:48 AM UTC</span>
              </div>
            </div>

            <div className="versions-snapshot-grid">
              <div className="versions-snapshot-item">
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Branch</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 14 }}>fork_right</span>
                  <span className="code-sm" style={{ fontWeight: 600 }}>{selected.branch}</span>
                </div>
              </div>
              <div className="versions-snapshot-item">
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Commit Hash</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 14 }}>commit</span>
                  <span className="code-sm" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container-high)', color: 'var(--primary)', fontWeight: 600 }}>{selected.commit}</span>
                </div>
              </div>
              <div className="versions-snapshot-item" style={{ paddingTop: 'var(--space-sm)' }}>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Author</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--on-primary)', fontWeight: 700 }}>
                    {selected.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                  <span className="body-sm" style={{ fontWeight: 500 }}>{selected.author}</span>
                </div>
              </div>
              <div className="versions-snapshot-item" style={{ paddingTop: 'var(--space-sm)' }}>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Claims Health</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="code-sm" style={{ fontWeight: 600 }}>{selected.changes} Claims</span>
                  {selected.unsupported > 0 && (
                    <span className="code-sm" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: 600 }}>{selected.unsupported} Unsup.</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <span className="headline-sm">Revision History</span>
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>3 Events Logged</span>
              </div>
              <div className="versions-timeline">
                {revisions.map((r) => (
                  <div key={r.revision} className="versions-timeline-item">
                    <span className="versions-timeline-dot" style={{ background: r.color }} />
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span className="code-sm" style={{ fontWeight: 600, color: r.color === 'var(--primary-container)' ? 'var(--primary)' : 'var(--on-surface)' }}>{r.revision}</span>
                      <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>{r.time}</span>
                    </div>
                    <p className="body-sm">{r.note}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }} className="label-sm">
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--secondary)' }}>person</span>
                      <span style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>{r.actor}</span>
                      <span style={{ color: 'var(--outline)' }}>-</span>
                      <span className="code-sm" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>{r.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="versions-integrity">
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary-container)', fontSize: 24 }}>verified_user</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="label-sm" style={{ fontWeight: 600 }}>Integrity Attestation</span>
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>SHA-256: 4b29f9...81e2 matches origin repository git tree.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', paddingTop: 'var(--space-xs)' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 40 }} onClick={(e) => handleViewSnapshot(selected, e)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                Inspect Detailed Snapshot
              </button>
              <Link to="/briefs" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', height: 36 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                View Full Release Package
              </Link>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', height: 36 }} onClick={() => exportSnapshotJson(selected)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                Export Snapshot JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeSnapshot && createPortal(
        <div className="snapshot-overlay" onClick={() => setActiveSnapshot(null)}>
          <div className="snapshot-panel card" onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  <span className="headline-lg" style={{ color: 'var(--primary)' }}>Snapshot {activeSnapshot.version}</span>
                  <StatusBadge status={activeSnapshot.status} />
                </div>
                <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{activeSnapshot.name}</span>
              </div>
              <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => setActiveSnapshot(null)} aria-label="Close snapshot">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="snapshot-meta-grid">
              <div style={{ background: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                <span className="label-sm" style={{ color: 'var(--outline)' }}>Git Commit SHA</span>
                <div className="code-md" style={{ fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>
                  {activeSnapshot.commit}982a4f10c81b
                </div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                <span className="label-sm" style={{ color: 'var(--outline)' }}>Branch</span>
                <div className="code-md" style={{ fontWeight: 600, marginTop: 4 }}>
                  {activeSnapshot.branch}
                </div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                <span className="label-sm" style={{ color: 'var(--outline)' }}>Author / Reviewer</span>
                <div className="body-md" style={{ fontWeight: 500, marginTop: 4 }}>
                  {activeSnapshot.author} ({activeSnapshot.reviewer})
                </div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                <span className="label-sm" style={{ color: 'var(--outline)' }}>Preserved Timestamp</span>
                <div className="body-md" style={{ fontWeight: 500, marginTop: 4 }}>
                  {activeSnapshot.preserved} • 10:48 AM
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)'
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 28 }}>verified_user</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="label-md" style={{ color: 'var(--success)', fontWeight: 600 }}>Immutable Cryptographic Seal Verified</span>
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Merkle Root: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => exportSnapshotJson(activeSnapshot)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                Download JSON
              </button>
              <Link to="/briefs" className="btn btn-primary" onClick={() => setActiveSnapshot(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                Open Release Brief
              </Link>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
