import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import '../css/briefs.css';

const evidenceStore = {
  'qa-3': { title: 'QA Evidence #3', body: '"PDF export was successfully tested on Chrome v118. Generated 50 sample reports without corruption. Automated Puppeteer suite passed 38 assertions."', source: 'QA Automation Suite', confidence: 'High (98%)', git: 'commit c9318b - pr #402', artifact: 'pdf_matrix_run_302.log' },
  'feat-1': { title: 'Feature #1', body: '"Client-side canvas rendering implementation with chunked SVG serialization. Passed throughput benchmark with 120ms average render times."', source: 'GitHub Pull Request #402', confidence: 'High (100%)', git: 'commit e812aa - pr #402', artifact: 'bench_perf_pdf.json' },
  'feat-2': { title: 'Feature #2', body: '"Theme switching provider with zero-runtime CSS variables injected at document root. Conforms to WCAG 2.1 AA contrast requirements."', source: 'Design Token Spec & PR #408', confidence: 'High (99%)', git: 'commit a719fb - pr #408', artifact: 'accessibility_scan_summary.xml' },
  'bug-982': { title: 'Bug #982', body: '"BroadcastChannel refresh pulse now prevents race condition between multiple active tabs. Validated across 10 concurrent tabs."', source: 'Jira / GitHub PR #411', confidence: 'Verified (95%)', git: 'commit f392ca - pr #411', artifact: 'cypress_tab_concurrency.mp4' },
  'lim-1': { title: 'Limitation #1', body: '"Safari WebKit WebGL offscreen canvas regression causes dropped frames on heavy documents. Tracking upstream in WebKit 284192."', source: 'WebKit Bugtracker / Issue #849', confidence: 'Confirmed Bug', git: 'issue #849', artifact: 'safari_trace_dump.heic' },
  'change-1': { title: 'Change #1', body: '"AUTH_POLICY_MAX_IDLE updated to 60m per RFC-82 enterprise idle policy updates."', source: 'Config / Auth Policy', confidence: 'High (100%)', git: 'commit f0198a - pr #415', artifact: 'auth_policy_diff.json' },
  'mig-1': { title: 'Migration #1', body: '"Prisma migration V24 deployed to PostgreSQL 16 cluster with zero lock contention."', source: 'DB Migration Script', confidence: 'Verified (100%)', git: 'commit e9910a - pr #420', artifact: 'prisma_v24.sql' }
};

const citationsList = [
  { id: 'feat-1', color: 'var(--primary)', pr: 'PR #402', desc: 'PDF Export Core' },
  { id: 'feat-2', color: 'var(--primary)', pr: 'PR #408', desc: 'Dark Mode Switch' },
  { id: 'bug-982', color: 'var(--tertiary)', pr: 'PR #411', desc: 'Login Timeout Sync' },
  { id: 'qa-3', color: 'var(--tertiary-container)', pr: '98% pass', desc: 'Puppeteer Regression' },
  { id: 'lim-1', color: 'var(--error)', pr: 'Issue #849', desc: 'Safari Canvas Bug' },
];

export default function ReleaseBriefs() {
  const [activeTab, setActiveTab] = useState('internal');
  const [activeCitation, setActiveCitation] = useState(evidenceStore['qa-3']);
  const [activeCitationId, setActiveCitationId] = useState('qa-3');

  // Editable Brief Sections
  const [overviewText, setOverviewText] = useState(
    'Release v2.4.0 introduces PDF export and Dark Mode, improves dashboard calculations, and updates session timeout behavior. The changes are intended to resolve data discrepancies in production analytics widgets and meet SOC-2 compliance requirements regarding inactive user sessions.'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [tempOverview, setTempOverview] = useState(overviewText);

  const showToast = useToast();

  const handleCitationClick = (id) => {
    if (evidenceStore[id]) {
      setActiveCitation(evidenceStore[id]);
      setActiveCitationId(id);
    } else {
      showToast(`Evidence [${id}] selected`);
    }
  };

  const getBriefMarkdown = () => {
    return `# Release Brief v2.4.0 - Dashboard Improvements\n\nDate: October 3, 2026\nAuthor: automated-agent-01 (audited by Alex Rivera)\n\n## 1. Overview\n${overviewText}\n\n## 2. What's New\n- Client-Side PDF Export Engine [Feature #1]\n- Global Accessible Dark Mode Theme [Feature #2]\n\n## 3. Bug Fixes\n- Fixed login timeout issue causing unwanted token invalidation during multi-tab sync [Bug #982]\n- Fixed incorrect dashboard rollup calculations [Bug #1044]\n\n## 4. Behaviour Changes\n- Session timeout duration adjusted from 30 minutes to 60 minutes per enterprise security policy.\n\n## 5. QA Summary & Automated Suite Matrix\n- Automated Test Pass Rate: 94.0% (47/50 tests passed)\n- Chrome v118: Passed\n- Firefox v120: Passed\n\n## 6. Known Limitations\n- PDF export is currently unavailable on Safari due to WebKit issue #849.\n`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getBriefMarkdown())
      .then(() => showToast('Brief content copied to clipboard'))
      .catch(() => showToast('Copied brief content'));
  };

  const handleDownloadMarkdown = () => {
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(getBriefMarkdown());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `release-brief-v2.4.0.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded release-brief-v2.4.0.md');
  };

  const handleSaveEdit = () => {
    setOverviewText(tempOverview);
    setIsEditing(false);
    showToast('Release Brief updated successfully');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="breadcrumb">
            <Link to="/">Releases</Link>
            <span>/</span>
            <span>v2.4.0</span>
            <span>/</span>
            <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Release Briefs</span>
          </div>
          <h1 className="headline-lg" style={{ letterSpacing: '-0.02em', marginTop: 2 }}>Release Briefs</h1>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Generate audience-specific, evidence-backed communication for this release.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Link to="/analysis" className="btn btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>arrow_back</span>
            Back to Analysis
          </Link>
          <button className="btn btn-secondary" onClick={() => showToast('AI Briefs regenerated with fresh telemetry')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>sync</span>
            Generate Again
          </button>
          <Link to="/review" className="btn btn-primary">
            Send to Review
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Context Bar */}
      <div className="briefs-context-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="headline-sm" style={{ fontWeight: 600 }}>Release v2.4.0</span>
            <span style={{ color: 'var(--on-surface-variant)' }}>-</span>
            <span className="body-md" style={{ fontWeight: 500 }}>Dashboard Improvements</span>
          </div>
          <span className="badge" style={{ background: 'rgba(0, 94, 64, 0.15)', color: 'var(--tertiary)' }}>
            <span className="dot" style={{ background: 'var(--tertiary)', animation: 'pulse 2s infinite' }} />
            AI Analysis Complete
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }} className="code-sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container-low)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fork_right</span>
            <span>Target:</span>
            <span style={{ fontWeight: 600 }}>release/v2.4</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container-low)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>commit</span>
            <span>Commit:</span>
            <span style={{ fontWeight: 600 }}>d98a2fe</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="briefs-tab-bar">
        <div className="briefs-tabs">
          <button className={`briefs-tab ${activeTab === 'internal' ? 'active' : ''}`} onClick={() => setActiveTab('internal')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>terminal</span>
            Internal Technical
            {activeTab === 'internal' && <span className="dot" />}
          </button>
          <button className={`briefs-tab ${activeTab === 'stakeholder' ? 'active' : ''}`} onClick={() => setActiveTab('stakeholder')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
            Client / Stakeholder
          </button>
        </div>
        <div className="briefs-tab-meta">
          <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Generated 4m ago via ReleasePilot Core AI</span>
          <button className="icon-btn" style={{ width: 'auto', height: 'auto', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={handleCopy} title="Copy brief markdown">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="layout-grid" style={{ alignItems: 'start' }}>
        <div className="col-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <article className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="briefs-doc-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span className="code-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)' }}>
                    {activeTab === 'internal' ? 'Engineering Specification' : 'Customer & Executive Changelog'}
                  </span>
                  <span style={{ color: 'var(--on-surface-variant)' }} className="code-sm">-</span>
                  <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Doc ID: #BRF-2026-v240</span>
                </div>
                <h2 className="headline-md" style={{ fontWeight: 700 }}>Release v2.4.0 - Dashboard Improvements</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 4, color: 'var(--on-surface-variant)' }} className="body-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
                  <span>October 3, 2026</span>
                  <span>-</span>
                  <span>Author: automated-agent-01 (audited by Alex Rivera)</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="badge" style={{ background: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>verified_user</span>
                  Evidence-Backed Draft
                </span>
              </div>
            </div>

            <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              
              {/* Section 1: Overview */}
              <section className="briefs-section">
                <div className="briefs-section-title">
                  <h3 className="briefs-section-label">1. Overview</h3>
                  <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>1 citation linked</span>
                </div>
                <p className="body-md" style={{ lineHeight: '1.5rem' }}>
                  {overviewText}
                  <button className="citation-tag" style={{ marginLeft: 4 }} onClick={() => handleCitationClick('feat-1')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>dataset</span>
                    [Feature #1]
                  </button>
                </p>
              </section>

              {/* Section 2: What's New */}
              <section className="briefs-section">
                <h3 className="briefs-section-label">2. What's New</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', listStyle: 'none' }}>
                  {[
                    { title: 'Client-Side PDF Export Engine', id: 'feat-1' },
                    { title: 'Global Accessible Dark Mode Theme', id: 'feat-2' },
                  ].map((item) => (
                    <li key={item.id} className="briefs-evidence-item">
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18, marginTop: 2 }}>add_circle</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                        <span style={{ fontWeight: 500 }}>{item.title}</span>
                        <button className="citation-tag" onClick={() => handleCitationClick(item.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>dataset</span>
                          [{item.id === 'feat-1' ? 'Feature #1' : 'Feature #2'}]
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3: Bug Fixes */}
              <section className="briefs-section">
                <h3 className="briefs-section-label">3. Bug Fixes</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', listStyle: 'none' }}>
                  {[
                    { title: 'Fixed login timeout issue causing unwanted token invalidation during multi-tab sync', id: 'bug-982', label: 'Bug #982' },
                    { title: 'Fixed incorrect dashboard rollup calculations for monthly annualized recurring revenue', id: 'bug-1044', label: 'Bug #1044' },
                  ].map((item) => (
                    <li key={item.id} className="briefs-evidence-item">
                      <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                        <span>{item.title}</span>
                        <button className="citation-tag" onClick={() => handleCitationClick(item.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>bug_report</span>
                          [{item.label}]
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 4: Behaviour Changes */}
              <section className="briefs-section">
                <h3 className="briefs-section-label">4. Behaviour Changes</h3>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'rgba(242, 243, 255, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20 }}>schedule</span>
                    <span className="body-md">
                      Session timeout duration adjusted from <strong style={{ color: 'var(--error)' }}>30 minutes</strong> to <strong style={{ color: 'var(--tertiary)' }}>60 minutes</strong> per enterprise security policy.
                    </span>
                  </div>
                  <button className="citation-tag" onClick={() => handleCitationClick('change-1')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>alt_route</span>
                    [Change #1]
                  </button>
                </div>
              </section>

              {/* Section 5: QA Summary */}
              <section className="briefs-section" style={{ background: 'rgba(242, 243, 255, 0.3)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-xl)' }}>
                <div className="briefs-section-title">
                  <h3 className="briefs-section-label">5. QA Summary & Automated Suite Matrix</h3>
                  <button className="badge badge-primary" style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleCitationClick('qa-3')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>policy</span>
                    [QA Evidence #3]
                  </button>
                </div>
                <div className="grid grid-2" style={{ marginTop: 4, gap: 'var(--space-md)' }}>
                  <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Automated Test Pass Rate</span>
                      <span className="code-sm" style={{ fontWeight: 700, color: 'var(--tertiary)' }}>94.0%</span>
                    </div>
                    <div className="progress-track" style={{ height: 8, marginBottom: 'var(--space-sm)' }}>
                      <div className="progress-fill" style={{ width: '94%', background: 'var(--tertiary)', height: 8 }} />
                    </div>
                    <span className="code-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>47 / 50 tests passed - 3 manual verifications</span>
                  </div>
                  <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 4 }}>Target Matrix Results</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                      {['Chrome v118', 'Firefox v120'].map((browser) => (
                        <div key={browser} style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="code-sm">
                          <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 16 }}>check_circle</span>
                          <span>{browser}: Passed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 6: Known Limitations */}
              <section className="briefs-section">
                <div className="briefs-section-title">
                  <h3 className="briefs-section-label">6. Known Limitations</h3>
                  <button className="citation-tag" onClick={() => handleCitationClick('lim-1')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>warning</span>
                    [Limitation #1]
                  </button>
                </div>
                <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }} className="body-md">
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20, marginTop: 2 }}>info</span>
                  <p>PDF export is currently unavailable on Safari due to WebKit canvas rendering issue <span className="code-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>#849</span>. A patch will follow in v2.4.1.</p>
                </div>
              </section>

            </div>

            {/* Doc Footer Actions */}
            <div className="briefs-bottom-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setTempOverview(overviewText);
                    setIsEditing(true);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--secondary)' }}>edit</span>
                  Edit Brief
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadMarkdown}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'var(--secondary)' }}>download</span>
                  Download Markdown
                </button>
              </div>
              <Link to="/review" className="btn btn-primary">
                Send to Review Queue
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>
          </article>

          <div className="briefs-traceability">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'rgba(0, 94, 64, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>fact_check</span>
              </div>
              <div>
                <div className="headline-sm">Release Ready For Governance</div>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Zero untracked code commits detected between branch diffs.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="code-sm" style={{ fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container-low)', color: 'var(--tertiary)' }}>100% Traceability Score</span>
            </div>
          </div>
        </div>

        {/* Sidebar Drawer */}
        <aside className="col-side briefs-side-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="briefs-evidence-drawer">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>find_in_page</span>
                <h2 className="headline-sm" style={{ fontWeight: 600 }}>Supporting Evidence</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(0, 94, 64, 0.15)', color: 'var(--tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tertiary)' }} />
                  Verified QA
                </span>
              </div>
            </div>

            <div className={`briefs-evidence-panel ${activeCitationId === 'qa-3' ? 'highlight' : ''}`} id="evidence-panel">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>Active Reference</span>
                <span className="code-sm" style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--primary-container)', color: 'var(--on-primary)', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                  {activeCitation.title}
                </span>
              </div>
              <div style={{ padding: 'var(--space-sm)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Evidence Payload</span>
                <p className="body-sm" style={{ lineHeight: '1.5rem' }}>{activeCitation.body}</p>
              </div>
              <div className="briefs-evidence-meta">
                <div className="briefs-evidence-meta-item">
                  <span style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>Source Type</span>
                  <span style={{ fontWeight: 500 }}>{activeCitation.source}</span>
                </div>
                <div className="briefs-evidence-meta-item">
                  <span style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>Confidence</span>
                  <span style={{ color: 'var(--tertiary)', fontWeight: 700 }}>{activeCitation.confidence}</span>
                </div>
                <div className="briefs-evidence-meta-item wide">
                  <span style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>Git Anchor</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, overflowWrap: 'anywhere' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>commit</span> {activeCitation.git}
                  </span>
                </div>
                <div className="briefs-evidence-meta-item wide">
                  <span style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em' }}>Artifact</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{activeCitation.artifact}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--on-surface-variant)' }} className="code-sm">
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 16 }}>verified</span>
                <span>Verified By: <strong style={{ color: 'var(--on-surface)' }}>QA Suite & AI Auditor</strong></span>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => showToast(`Full test log artifact opened: ${activeCitation.artifact}`)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--secondary)' }}>launch</span>
                View Full Test Run
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 'var(--space-sm)' }}>
              <span className="label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Citations in Document</span>
              {citationsList.map((c) => (
                <button key={c.id} className={`briefs-citation-row ${activeCitationId === c.id ? 'active' : ''}`} onClick={() => handleCitationClick(c.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', overflow: 'hidden' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span className="code-sm" style={{ fontWeight: 600 }}>[{evidenceStore[c.id]?.title || c.id}]</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.desc}</span>
                  </div>
                  <span className="code-sm" style={{ color: 'var(--secondary)' }}>{c.pr}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* EDIT BRIEF MODAL */}
      {isEditing && (
        <div className="compare-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="compare-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>edit_note</span>
                <div>
                  <h3 className="headline-sm">Edit Release Brief Overview</h3>
                  <span className="code-sm" style={{ color: 'var(--secondary)' }}>Modify executive section summary</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setIsEditing(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <label className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)' }}>Overview Text</label>
              <textarea
                className="input"
                rows={5}
                value={tempOverview}
                onChange={(e) => setTempOverview(e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5rem', fontFamily: 'var(--font-sans)', padding: 'var(--space-md)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Brief Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
