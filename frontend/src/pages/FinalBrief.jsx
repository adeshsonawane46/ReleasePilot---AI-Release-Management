import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import '../css/finalbrief.css';

const briefSections = [
  { num: '01', title: 'Release Overview', content: 'Release v2.4.0 introduces client-side PDF export and an accessible Dark Mode theme, improves dashboard calculations, and updates session timeout policies to 60 minutes for all enterprise tiers.', citations: ['Feature #1', 'Feature #2'] },
  { num: '02', title: "What's New", content: 'PDF Export: Users can export tabular and chart reports as PDF with customizable presets and automated headers. Dark Mode: Comprehensive high-contrast dark theme toggle accessible in user preferences.', citations: [] },
  { num: '03', title: 'Bug Fixes', content: 'Fixed login timeout issue causing token invalidation during multi-tab sessions. Fixed incorrect dashboard rollup calculations for monthly annualized recurring revenue.', citations: ['Bug #982', 'Bug #1044'] },
  { num: '04', title: 'Behaviour Changes', content: 'Session timeout duration adjusted from 30 minutes to 60 minutes per enterprise security governance RFC-82.', citations: ['Change #1'] },
  { num: '05', title: 'QA Summary & Test Matrix', content: '', citations: ['QA Evidence #3'] },
  { num: '06', title: 'Migration & Configuration', content: '', citations: ['Migration #1'] },
  { num: '07', title: 'Known Limitations', content: 'PDF export is currently unavailable on Safari due to upstream WebKit canvas rendering issue #849. Fix anticipated in patch v2.4.1.', citations: ['Limitation #1'] },
  { num: '08', title: 'Risks & Operational Considerations', content: 'Chrome validation is complete; Firefox suites ran with partial assertions. Automated retry pipelines provisioned to monitor error spikes.', citations: ['QA Evidence #3'] },
  { num: '09', title: 'Affected Audiences', content: '', citations: [] },
];

const revisionHistory = [
  { title: 'Revision 3.0 (Final Sealed)', note: 'Approved & finalized by Alex Rivera (Lead Eng). Signed with immutable cryptographic signature.', time: 'Today at 10:52 AM UTC', status: 'Approved', color: 'var(--tertiary)' },
  { title: 'Revision 2.1 (Security Review)', note: 'Adjusted RFC-82 session duration from 30 min to 60 min. Checked by SecOps team.', time: 'Today at 09:14 AM UTC', status: null, color: 'var(--secondary)' },
  { title: 'Revision 1.0 (Initial Draft)', note: 'Synthesized changelog draft from pull requests and QA test run #5012.', time: 'Yesterday at 4:30 PM UTC', status: null, color: 'var(--secondary)' },
];

const distributionTargets = [
  'Public Developer Changelog',
  'Enterprise Customer Advisory',
  'Internal Slack: #eng-releases',
  'Git Tag v2.4.0 (Protected)',
];

export default function FinalBrief() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [targets, setTargets] = useState(() => distributionTargets.map((label) => ({ label, enabled: true })));
  const showToast = useToast();

  const generateMarkdown = () => {
    let md = '# Final Release Brief: v2.4.0 (Dashboard Improvements)\n\n';
    briefSections.forEach((s) => {
      md += `## ${s.num}. ${s.title}\n\n`;
      if (s.content) md += `${s.content}\n\n`;
      if (s.citations.length > 0) md += `Citations: ${s.citations.map((c) => `[${c}]`).join(' ')}\n\n`;
    });
    return md;
  };

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      showToast('Brief Markdown copied to clipboard');
    } catch {
      showToast('Failed to copy brief');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 1240 }}>
      <section className="finalbrief-trust-banner">
        <div className="finalbrief-glow" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)', zIndex: 10 }}>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.02em', boxShadow: 'var(--shadow-sm)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>verified</span>
            HUMAN REVIEWED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 className="headline-sm" style={{ color: 'var(--on-tertiary)', letterSpacing: '-0.01em' }}>
              All required statements have been reviewed and approved by an authorized engineering lead.
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--tertiary-fixed)', fontSize: '0.875rem', opacity: 0.95 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_check</span>
                Signed by <strong style={{ color: '#fff', fontWeight: 500, marginLeft: 4 }}>Alex Rivera (Lead Eng)</strong>
              </span>
              <span style={{ opacity: 0.6 }}>-</span>
              <span>October 3, 2026 at 10:52 AM UTC</span>
              <span style={{ opacity: 0.6 }}>-</span>
              <span className="code-sm" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--tertiary-fixed)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => showToast('Audit Hash copied')}>
                sha256:4b29f9...81e2
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', alignSelf: 'flex-end', zIndex: 10, flexShrink: 0 }}>
          <span className="code-sm" style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)' }}>
            Status: Human Approved
          </span>
        </div>
      </section>

      <header style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', paddingBottom: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
            <span className="code-sm" style={{ textTransform: 'uppercase', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Artifact ReleaseBrief-v2.4.0</span>
            <span style={{ color: 'var(--outline-variant)' }} className="code-sm">/</span>
            <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Production Target</span>
          </div>
          <h1 className="headline-md" style={{ fontWeight: 600 }}>Final Release Brief: v2.4.0 (Dashboard Improvements)</h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" style={{ height: 36 }} onClick={handleCopyBrief}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--secondary)' }}>content_copy</span>
            <span className="label-md">Copy Brief</span>
          </button>
          <button className="btn btn-secondary" style={{ height: 36 }} onClick={handleExportPDF}>
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--primary)' }}>picture_as_pdf</span>
            <span className="label-md">Export PDF</span>
          </button>
          <Link to="/review" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 36, padding: '0 var(--space-lg)', borderRadius: 'var(--radius-lg)', color: 'var(--secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
            <span className="label-md">Back to Review Queue</span>
          </Link>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 36, padding: '0 var(--space-sm)', borderRadius: 'var(--radius-lg)', background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }} onClick={() => setDrawerOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>history</span>
            <span className="label-md">Version History</span>
          </button>
        </div>
      </header>

      <div className="layout-grid" style={{ alignItems: 'start' }}>
        <article className="finalbrief-doc col-main">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--tertiary)', display: 'inline-block' }} />
              <span className="code-sm" style={{ color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Validated Engineering Manifest</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--on-surface-variant)' }} className="code-sm">
              <span>Doc ID: REL-2026-10-03-B</span>
              <span style={{ color: 'var(--outline-variant)' }}>-</span>
              <span>Rev 3.0 Final</span>
            </div>
          </div>

          {briefSections.map((section) => (
            <section key={section.num} className="finalbrief-section">
              <div className="finalbrief-section-title">
                <h3 className="finalbrief-section-heading">
                  <span className="finalbrief-section-number">{section.num}</span>
                  {section.title}
                </h3>
                {section.citations.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {section.citations.map((c) => (
                      <button key={c} className="citation-tag" onClick={() => showToast(`Jumping to ${c}`)}>{`[${c}]`}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="finalbrief-content">
                {section.num === '05' ? (
                  <div className="grid grid-3" style={{ padding: 'var(--space-lg)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <ProgressRing value={94} size={48} color="var(--tertiary)" label="94%" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="label-sm" style={{ textTransform: 'uppercase', color: 'var(--secondary)' }}>Pass Rate</span>
                        <span className="headline-sm" style={{ fontWeight: 600 }}>47 / 50</span>
                        <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Automated tests</span>
                      </div>
                    </div>
                    {[
                      { name: 'Chrome v118', pct: 100, assertions: '28/28 assertions' },
                      { name: 'Firefox v120', pct: 86, assertions: '19/22 assertions (3 skipped)' },
                    ].map((b) => (
                      <div key={b.name} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--space-sm)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                          <span className="body-sm" style={{ fontWeight: 500 }}>{b.name}</span>
                          <span className="code-sm" style={{ color: 'var(--tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)', display: 'inline-block' }} /> Passed
                          </span>
                        </div>
                        <div className="progress-track" style={{ marginTop: 'var(--space-sm)' }}>
                          <div className="progress-fill" style={{ width: `${b.pct}%`, background: 'var(--tertiary)' }} />
                        </div>
                        <span className="code-sm" style={{ color: 'var(--secondary)', marginTop: 4 }}>{b.assertions}</span>
                      </div>
                    ))}
                  </div>
                ) : section.num === '06' ? (
                  <div style={{ padding: 'var(--space-lg)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }} className="code-sm">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--secondary)', fontWeight: 500 }}>Database migration V24:</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => showToast('Command copied')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>content_copy</span>
                        <span>Copy</span>
                      </button>
                    </div>
                    <div style={{ background: 'var(--surface-container-lowest)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--primary)' }}>
                      prisma migrate deploy
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'var(--secondary)', fontWeight: 500 }}>Environment variable flag:</span>
                    </div>
                    <div style={{ background: 'var(--surface-container-lowest)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 500 }}>
                      REPORT_EXPORT_ENABLED=true
                    </div>
                  </div>
                ) : section.num === '09' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', paddingTop: 4 }}>
                    {['All Users', 'Admins', 'Developers'].map((g) => (
                      <span key={g} className="badge badge-neutral" style={{ padding: '4px var(--space-md)', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>{g}</span>
                    ))}
                    <span className="badge" style={{ padding: '4px var(--space-md)', borderRadius: 'var(--radius-full)', background: 'var(--secondary-container)', color: 'var(--on-secondary-fixed)', fontWeight: 600 }}>Enterprise Customers</span>
                  </div>
                ) : (
                  <p className="body-md" style={{ lineHeight: '1.5rem' }}>{section.content}</p>
                )}
              </div>
            </section>
          ))}

          <footer className="finalbrief-seal">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--on-tertiary-fixed)', fontSize: 24 }}>verified_user</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="headline-sm" style={{ fontWeight: 600 }}>Immutable Verification Seal</span>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Officially signed and finalized for production release distribution. Immutable audit record sealed.</p>
              </div>
            </div>
            <button className="btn btn-primary" style={{ height: 40, whiteSpace: 'nowrap' }} onClick={() => showToast('Bundle package ready: release-v2.4.0-bundle.tar.gz')}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
              Export Documentation Bundle
            </button>
          </footer>
        </article>

        <aside className="col-side finalbrief-side-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="finalbrief-signoff">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--secondary)', fontWeight: 600 }}>Lead Sign-Off</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--tertiary)', fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)' }} /> Authenticated
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary)', fontWeight: 600 }} className="headline-sm">AR</div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="body-md" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Alex Rivera</span>
                <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Lead Engineering Director</span>
                <span className="code-sm" style={{ color: 'var(--secondary)' }}>alex.rivera@internal.org</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 'var(--space-xs)' }} className="code-sm">
              {[
                { label: 'Signature Class:', value: 'ED25519 Token' },
                { label: 'Role Clearance:', value: 'SecOps / Release Level 4' },
                { label: 'Signed At:', value: '2026-10-03 10:52 UTC' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="finalbrief-gates">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--secondary)', fontWeight: 600 }}>Pre-Deployment Gates</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                { icon: 'verified', label: 'Human Peer Review', status: 'Passed', color: 'var(--tertiary)' },
                { icon: 'security', label: 'Dependency Audit', status: '0 CVE', color: 'var(--tertiary)' },
                { icon: 'dns', label: 'DB Schema Dry-run', status: 'Clean', color: 'var(--tertiary)' },
                { icon: 'check_box', label: 'Canary Route Setup', status: 'Ready', color: 'var(--secondary)' },
              ].map((gate) => (
                <div key={gate.label} className="finalbrief-gate-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className="material-symbols-outlined" style={{ color: gate.color, fontSize: 18 }}>{gate.icon}</span>
                    <span className="body-sm" style={{ fontWeight: 500 }}>{gate.label}</span>
                  </div>
                  <span className="code-sm" style={{ color: gate.color, fontWeight: 600 }}>{gate.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="finalbrief-distribution">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--secondary)', fontWeight: 600 }}>Distribution Targets</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.875rem' }}>
              {targets.map((target) => (
                <label key={target.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '4px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={target.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setTargets((prev) => prev.map((t) => (t.label === target.label ? { ...t, enabled } : t)));
                      showToast(`${target.label} ${enabled ? 'enabled' : 'disabled'}`);
                    }}
                    style={{ accentColor: 'var(--primary-container)' }}
                  />
                  <span style={{ opacity: target.enabled ? 1 : 0.5, textDecoration: target.enabled ? 'none' : 'line-through' }}>{target.label}</span>
                </label>
              ))}
              <span className="code-sm" style={{ color: 'var(--outline)', marginTop: 4 }}>
                {targets.filter((t) => t.enabled).length} of {targets.length} targets enabled
              </span>
            </div>
          </div>
        </aside>
      </div>

      {drawerOpen && (
        <div className="finalbrief-drawer-overlay">
          <div className="finalbrief-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="finalbrief-drawer">
            <div className="finalbrief-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)' }}>history_edu</span>
                <h3 className="headline-sm" style={{ fontWeight: 600 }}>Brief Revision History</h3>
              </div>
              <button className="icon-btn" onClick={() => setDrawerOpen(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div className="finalbrief-drawer-body">
              {revisionHistory.map((rev) => (
                <div key={rev.title} className="finalbrief-timeline-item">
                  <span className="finalbrief-timeline-dot" style={{ background: rev.color }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="body-md" style={{ fontWeight: 600 }}>{rev.title}</span>
                      {rev.status && (
                        <span className="code-sm" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', fontWeight: 700 }}>{rev.status}</span>
                      )}
                    </div>
                    <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{rev.note}</p>
                    <span className="code-sm" style={{ color: 'var(--secondary)' }}>{rev.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="finalbrief-drawer-footer">
              <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>Close Panel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
