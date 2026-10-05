import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import '../css/compare.css';

const fallbackComparison = {
  summary: { added: 3, changed: 2, removed: 0, staleStatements: 2 },
  addedFeatures: [
    { title: 'PDF Export Engine', description: 'Users can now export synthesized rollup reports as vector PDF directly from the dashboard view with customizable date ranges and embedded signature metadata.', domain: 'Reporting', loc: '+340 LOC', pr: 'PR #402', commit: '8f3c1a2' },
    { title: 'Dark Mode UI Engine', description: 'Comprehensive tokenized dark color scheme toggle for low-light developer workflows, synchronizing dynamically with host OS accessibility settings.', domain: 'Client / Shell', loc: '+182 LOC', pr: 'PR #418', commit: '9d2b4e7' },
  ],
  bugFixes: [
    { title: 'Resolved authentication session timeout race', description: 'Fixed premature logout triggered by stale heartbeat telemetry during background multi-tab sync.', bugId: 'BUG-982', pr: 'PR #398' },
    { title: 'Fixed incorrect dashboard rollup calculations', description: 'Corrected floating point rounding discrepancies in time-weighted latency distributions across edge nodes.', bugId: 'BUG-1044', pr: 'PR #405' },
  ],
  behaviourChanges: [
    { title: 'Enterprise Session Timeout Window', description: 'Inactivity thresholds before forced single sign-on re-authentication have been systematically expanded to reduce developer context-switching friction.', oldValue: '30 minutes', newValue: '60 minutes', key: 'AUTH_POLICY_MAX_IDLE' },
  ],
  limitations: [
    { title: 'Safari PDF Export Limitation', description: 'PDF export is temporarily marked unavailable on Safari 17.1 desktop due to an upstream WebKit HTML5 canvas offscreen rasterization bug. Fallback CSV download continues to function unhindered.', issue: 'Issue #849' },
  ],
  staleStatements: [
    { id: 1, previous: '"Users cannot export reports as PDF directly from the dashboard view."', reason: 'Native vector PDF Export was formally introduced in v2.4.0 with customizable date ranges.', trigger: 'Feature #1 (PR #402)', replacement: 'Enterprise and standard tier users can now export consolidated reports directly to PDF format from any dashboard viewport, choosing from standard presets or granular custom date windows.' },
    { id: 2, previous: '"Session timeout is 30 minutes for enterprise accounts."', reason: 'Global authentication session idle timeout window extended to 60 minutes in v2.4.0 policy update.', trigger: 'Behaviour Change #1', replacement: 'Security policy now provides an expanded 60-minute session idle timeout window across all enterprise workspaces prior to re-authentication.' },
  ],
};

const sampleAstDiff = `--- Base Baseline: v2.3.0
+++ Target Release: v2.4.0

@@ -14,7 +14,7 @@ config/auth.json
 {
   "AUTH_POLICY_MAX_IDLE": {
-    "value": "30m",
+    "value": "60m",
     "enforcement": "strict"
   }
 }

@@ +402,12 @@ src/services/pdfExport.ts
+export async function generateVectorPdfReport(params: ReportOptions): Promise<Buffer> {
+  // AST Synthesizer v2.4.0
+  const doc = new PDFDocument({ margin: 36 });
+  doc.text("ReleasePilot Automated Executive Brief", { align: "center" });
+  return doc.finalize();
+}
`;

export default function CompareReleases() {
  const [versionA, setVersionA] = useState('v2.3.0');
  const [versionB, setVersionB] = useState('v2.4.0');
  const [comparison, setComparison] = useState(fallbackComparison);
  const [modalStatement, setModalStatement] = useState(null);
  const [resolvedStale, setResolvedStale] = useState(new Set());
  
  // Modals & Popovers
  const [showAstModal, setShowAstModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [itemDetailModal, setItemDetailModal] = useState(null);

  // Category filters
  const [activeFilters, setActiveFilters] = useState({
    features: true,
    bugFixes: true,
    behaviour: true,
    limitations: true,
    stale: true,
  });

  const showToast = useToast();

  const handleSwap = () => {
    const nextA = versionB;
    const nextB = versionA;
    setVersionA(nextA);
    setVersionB(nextB);
    showToast(`Swapped: Base is now ${nextA}, Target is ${nextB}`);
  };

  const handleCompare = async () => {
    try {
      const result = await api.compareReleases(versionA, versionB);
      if (result && result.summary) {
        setComparison(result);
      }
      showToast(`Diff recomputed: ${versionA} vs ${versionB}`);
    } catch {
      showToast(`Diff recomputed for ${versionA} vs ${versionB} (local mode)`);
    }
  };

  const handleAcknowledge = (id) => {
    setResolvedStale((prev) => new Set(prev).add(id));
    showToast(`Stale statement #${id} acknowledged and marked resolved`);
  };

  const toggleFilter = (key) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  const handleExportDiff = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      baseline: versionA,
      target: versionB,
      comparedAt: new Date().toISOString(),
      summary: comparison.summary,
      addedFeatures: comparison.addedFeatures,
      bugFixes: comparison.bugFixes,
      behaviourChanges: comparison.behaviourChanges,
      limitations: comparison.limitations,
      staleStatements: comparison.staleStatements,
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `release-diff-${versionA}-to-${versionB}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported release-diff-${versionA}-to-${versionB}.json`);
  };

  const activeStaleCount = Math.max(0, comparison.staleStatements.length - resolvedStale.size);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter-lg)' }}>
      {/* Header Card */}
      <div className="compare-header-card">
        <div className="compare-glow" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', zIndex: 10, maxWidth: 512 }}>
          <div className="breadcrumb">
            <Link to="/">Releases</Link>
            <span>/</span>
            <span style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--primary-container)' }}>Compare Matrix</span>
          </div>
          <h1 className="headline-xl" style={{ letterSpacing: '-0.025em' }}>Compare Release Versions</h1>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Identify semantic shifts between packaging manifests, highlight behavioural drift, and isolate stale customer-facing statements with deep-linked AST citations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', zIndex: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowAstModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>code_blocks</span>
            Unified AST Diff
          </button>
          
          <button className={`btn ${activeFilterCount < 5 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowFilterModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
            Diff Filters ({activeFilterCount}/5)
          </button>
        </div>
      </div>

      {/* Selector Bar */}
      <div className="compare-selector-bar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', flex: 1 }}>
          <div className="compare-version-select">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Base Baseline (A)</span>
              <span className="code-sm" style={{ color: 'var(--secondary)' }}>commit 8f3c1a2</span>
            </div>
            <select className="select" value={versionA} onChange={(e) => setVersionA(e.target.value)} style={{ height: 40, fontFamily: 'var(--font-mono)' }}>
              <option value="v2.3.0">v2.3.0 (Sep 20, 2026)</option>
              <option value="v2.2.4">v2.2.4 (Aug 14, 2026)</option>
              <option value="v2.2.0">v2.2.0 (Jul 02, 2026)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
            <button className="compare-swap-btn" onClick={handleSwap} title="Swap comparison directions">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>swap_horiz</span>
              <span className="code-sm" style={{ fontWeight: 600 }}>Swap</span>
            </button>
          </div>

          <div className="compare-version-select">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Target Release (B)</span>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>Target Gate</span>
            </div>
            <select className="select" value={versionB} onChange={(e) => setVersionB(e.target.value)} style={{ height: 40, fontFamily: 'var(--font-mono)' }}>
              <option value="v2.4.0">v2.4.0 (Current Target) - Release Candidate 3</option>
              <option value="v2.4.0-rc2">v2.4.0-rc2 (Oct 01, 2026)</option>
              <option value="v2.4.0-rc1">v2.4.0-rc1 (Sep 28, 2026)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-sm)', paddingTop: 8 }}>
          <button className="btn btn-primary btn-lg" onClick={handleCompare}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>compare_arrows</span>
            Re-compute Diff
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4">
        <div className="compare-stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Added Delta</span>
              <span className="headline-xl" style={{ marginTop: 4 }}>{comparison.summary.added}</span>
            </div>
            <span className="badge" style={{ background: 'rgba(0, 68, 45, 0.1)', color: 'var(--tertiary)', fontWeight: 600 }}>
              <span className="dot" style={{ background: 'var(--tertiary)' }} />
              +{comparison.summary.added} Nodes
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="body-sm">
            <span className="code-sm" style={{ color: 'var(--tertiary)', fontWeight: 600 }}>+2 Features</span>
            <span>-</span>
            <span className="code-sm" style={{ color: 'var(--secondary)', fontWeight: 600 }}>+1 Limitation</span>
          </div>
          <div className="compare-stat-accent" style={{ background: 'var(--tertiary)' }} />
        </div>

        <div className="compare-stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Changed Specs</span>
              <span className="headline-xl" style={{ marginTop: 4 }}>{comparison.summary.changed}</span>
            </div>
            <span className="badge" style={{ background: 'rgba(67, 56, 202, 0.1)', color: 'var(--primary-container)', fontWeight: 600 }}>
              <span className="dot" style={{ background: 'var(--primary-container)' }} />
              Modified
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="body-sm">
            <span>Behavior timeout & metrics rollup specs</span>
          </div>
          <div className="compare-stat-accent" style={{ background: 'var(--primary-container)' }} />
        </div>

        <div className="compare-stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Removed Spec</span>
              <span className="headline-xl" style={{ marginTop: 4 }}>{comparison.summary.removed}</span>
            </div>
            <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
              <span className="dot" style={{ background: 'var(--outline)' }} />
              Zero Loss
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="body-sm">
            <span>No legacy endpoints marked removed</span>
          </div>
          <div className="compare-stat-accent" style={{ background: 'var(--surface-variant)' }} />
        </div>

        <div className="compare-stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Stale Statements</span>
              <span className="headline-xl" style={{ marginTop: 4, color: activeStaleCount > 0 ? 'var(--error)' : 'var(--tertiary)' }}>
                {activeStaleCount}
              </span>
            </div>
            <span className={`badge ${activeStaleCount > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 600 }}>
              <span className="dot" style={{ background: activeStaleCount > 0 ? 'var(--error)' : 'var(--tertiary)' }} />
              {activeStaleCount > 0 ? 'Requires Notice' : 'All Clear'}
            </span>
          </div>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }} className="body-sm">
            <span style={{ color: activeStaleCount > 0 ? 'var(--error)' : 'var(--tertiary)', fontWeight: 500 }}>
              {activeStaleCount > 0 ? `${activeStaleCount} pending acknowledgement` : 'All stale statements resolved'}
            </span>
          </div>
          <div className="compare-stat-accent" style={{ background: activeStaleCount > 0 ? 'var(--error)' : 'var(--tertiary)' }} />
        </div>
      </div>

      {/* Grid Comparison Sections */}
      <div className="layout-grid">
        
        {/* Left 7 Columns */}
        <div className="col-7" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          {/* Feature Changes */}
          {activeFilters.features && (
            <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>new_releases</span>
                  <h2 className="headline-sm">Feature Changes</h2>
                </div>
                <span className="badge" style={{ background: 'rgba(0, 68, 45, 0.15)', color: 'var(--tertiary)', fontWeight: 600 }}>
                  {comparison.addedFeatures.length} Additions
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {comparison.addedFeatures.map((f) => (
                  <div key={f.title} className="compare-feature-item">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span className="code-sm" style={{ fontWeight: 600, color: 'var(--tertiary)', background: 'var(--surface-container-lowest)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>[ADDED]</span>
                        <span className="headline-sm" style={{ fontSize: 15 }}>{f.title}</span>
                      </div>
                      
                      <button
                        className="code-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container)', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => setItemDetailModal({ type: 'PR', id: f.pr, title: f.title, commit: f.commit, description: f.description })}
                      >
                        {f.pr}
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                      </button>
                    </div>

                    <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{f.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', paddingTop: 4 }} className="code-sm">
                      <span>Domain: {f.domain}</span>
                      <span>-</span>
                      <span>Diff: {f.loc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bug Fixes */}
          {activeFilters.bugFixes && (
            <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>pest_control</span>
                  <h2 className="headline-sm">Resolved Bug Fixes</h2>
                </div>
                <span className="badge badge-info" style={{ fontWeight: 600 }}>
                  {comparison.bugFixes.length} Resolved
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {comparison.bugFixes.map((b) => (
                  <div key={b.bugId} className="compare-feature-item" style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span className="code-sm" style={{ fontWeight: 600, color: 'var(--tertiary)', background: 'var(--surface-container-lowest)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>[FIXED]</span>
                        <span className="body-md" style={{ fontWeight: 600 }}>{b.title}</span>
                      </div>
                      <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{b.description}</p>
                    </div>

                    <button
                      className="code-sm"
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container)', border: 'none', flexShrink: 0, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                      onClick={() => setItemDetailModal({ type: 'Bug Issue', id: b.bugId, title: b.title, pr: b.pr, description: b.description })}
                    >
                      {b.bugId}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behaviour Changes */}
          {activeFilters.behaviour && (
            <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>sync_alt</span>
                  <h2 className="headline-sm">Behaviour Changes</h2>
                </div>
                <span className="badge" style={{ background: 'rgba(67, 56, 202, 0.15)', color: 'var(--primary-container)', fontWeight: 600 }}>
                  {comparison.behaviourChanges.length} Drift
                </span>
              </div>

              {comparison.behaviourChanges.map((c) => (
                <div key={c.title} className="compare-feature-item">
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="code-sm" style={{ fontWeight: 600, color: 'var(--primary)', background: 'var(--surface-container-lowest)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>[CHANGED]</span>
                      <span className="headline-sm" style={{ fontSize: 15 }}>{c.title}</span>
                    </div>
                    <span className="code-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>{c.key}</span>
                  </div>

                  <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{c.description}</p>
                  
                  <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>{versionA} Standard</span>
                      <span className="code-md" style={{ color: 'var(--secondary)', textDecoration: 'line-through', fontWeight: 600 }}>{c.oldValue}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(208, 225, 251, 0.8)', color: 'var(--on-secondary-fixed)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>arrow_forward</span>
                      <span className="code-sm" style={{ fontWeight: 700 }}>{c.oldValue} &gt; {c.newValue}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                      <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>{versionB} Target</span>
                      <span className="code-md" style={{ color: 'var(--tertiary)', fontWeight: 700 }}>{c.newValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Limitations */}
          {activeFilters.limitations && (
            <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20 }}>warning_amber</span>
                  <h2 className="headline-sm">Limitation Changes</h2>
                </div>
                <span className="badge badge-danger" style={{ fontWeight: 600 }}>
                  {comparison.limitations.length} Constraint
                </span>
              </div>

              {comparison.limitations.map((l) => (
                <div key={l.title} className="compare-feature-item" style={{ gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="code-sm" style={{ fontWeight: 600, color: 'var(--secondary)', background: 'var(--surface-container-lowest)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>[ADDED]</span>
                      <span className="headline-sm" style={{ fontSize: 15 }}>{l.title}</span>
                    </div>
                    <button
                      className="code-sm"
                      style={{ background: 'var(--surface-container)', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600 }}
                      onClick={() => setItemDetailModal({ type: 'Known Limitation Issue', id: l.issue, title: l.title, description: l.description })}
                    >
                      {l.issue}
                    </button>
                  </div>
                  <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>{l.description}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right 5 Columns */}
        <div className="col-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          {/* Stale Statements Card */}
          {activeFilters.stale && (
            <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className="material-symbols-outlined" style={{ color: activeStaleCount > 0 ? 'var(--error)' : 'var(--tertiary)', fontSize: 22 }}>history_toggle_off</span>
                    <h2 className="headline-md" style={{ letterSpacing: '-0.015em' }}>Stale Statements</h2>
                  </div>
                  <span className={`badge ${activeStaleCount > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 700 }}>
                    {activeStaleCount > 0 ? `${activeStaleCount} Pending` : 'All Resolved'}
                  </span>
                </div>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Statements from previous release communications that are invalidated or contradicted by modifications introduced in <span className="code-sm" style={{ fontWeight: 600 }}>{versionB}</span>.
                </p>
              </div>

              {comparison.staleStatements.map((s) => {
                const isResolved = resolvedStale.has(s.id);
                return (
                  <div key={s.id} className="compare-stale-card" style={{ opacity: isResolved ? 0.6 : 1, border: isResolved ? '1px solid var(--outline-variant)' : '1px solid rgba(225, 29, 72, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <span className={`badge ${isResolved ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                        <span className="dot" style={{ background: isResolved ? 'var(--tertiary)' : 'var(--error)' }} />
                        {isResolved ? 'RESOLVED & SYNCED' : 'STALE STATEMENT'}
                      </span>
                      <span className="code-sm" style={{ color: 'var(--secondary)' }}>Source: {versionA} Release Notes</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-sm)' }}>
                      <span className="label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Previous Customer Statement</span>
                      <p className="body-md" style={{ color: isResolved ? 'var(--on-surface-variant)' : 'var(--error)', fontStyle: 'italic' }}>{s.previous}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Why it became stale</span>
                      <p className="body-sm">{s.reason}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="code-sm">
                        <span>Trigger:</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.trigger}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', paddingTop: 'var(--space-xs)' }}>
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalStatement(s)}>
                        View Updated Statement
                      </button>
                      
                      {!isResolved ? (
                        <button className="btn btn-secondary" onClick={() => handleAcknowledge(s.id)}>
                          Acknowledge Stale
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.7 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--tertiary)' }}>check</span>
                          Acknowledged
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20 }}>psychology</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="body-sm" style={{ fontWeight: 600 }}>AI Statement Alignment Model</span>
                    <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Validated against 114 release claims</span>
                  </div>
                </div>
                <span className="code-sm" style={{ color: 'var(--tertiary)', fontWeight: 700 }}>98.2% Confidence</span>
              </div>
            </div>
          )}

          {/* Architecture Summary */}
          <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <h3 className="headline-sm">Package Architecture Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                { label: 'SemVer Impact', value: `MINOR (${versionA} > ${versionB})`, color: 'var(--on-secondary-fixed)', bg: 'var(--secondary-container)' },
                { label: 'Breaking Schemas', value: '0 Breaking Changes Detected', color: 'var(--tertiary)' },
                { label: 'Database Migrations', value: '2 Non-destructive (Pg 16)', color: 'var(--secondary)' },
                { label: 'Compliance Delta', value: 'SOC2 Type II Compatible', color: 'var(--tertiary)' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', padding: 'var(--space-xs) 0' }} className="body-sm">
                  <span style={{ color: 'var(--on-surface-variant)' }}>{row.label}</span>
                  <span className="code-sm" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: row.bg || 'transparent', color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="compare-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Back to Releases
          </Link>
          <button className="btn btn-secondary btn-lg" onClick={handleExportDiff}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
            Export Diff Report (.json)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link to="/briefs" className="btn btn-primary btn-lg">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_stories</span>
            Generate Updated Customer Briefing
          </Link>
        </div>
      </div>

      {/* MODAL 1: Unified AST Diff Viewer Modal */}
      {showAstModal && (
        <div className="compare-modal-overlay" onClick={() => setShowAstModal(false)}>
          <div className="compare-modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>code_blocks</span>
                <div>
                  <h3 className="headline-sm">Unified AST Code & Manifest Diff</h3>
                  <span className="code-sm" style={{ color: 'var(--secondary)' }}>Comparing {versionA} vs {versionB}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAstModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ background: '#1e293b', color: '#f8fafc', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', overflowX: 'auto', maxHeight: 340, lineHeight: 1.6 }}>
              <pre>{sampleAstDiff}</pre>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>AST Parsing Engine: v4.2.1 • 100% Syntax Verified</span>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(sampleAstDiff);
                    showToast('AST Diff copied to clipboard');
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                  Copy Diff
                </button>
                <button className="btn btn-primary" onClick={() => setShowAstModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Diff Filters Toggle Modal */}
      {showFilterModal && (
        <div className="compare-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="compare-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>tune</span>
                <div>
                  <h3 className="headline-sm">Configure Diff Filters</h3>
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Toggle visible categories in compare matrix</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowFilterModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                { key: 'features', label: 'Feature Changes / Additions', count: comparison.addedFeatures.length },
                { key: 'bugFixes', label: 'Resolved Bug Fixes', count: comparison.bugFixes.length },
                { key: 'behaviour', label: 'Behaviour Drift & Changes', count: comparison.behaviourChanges.length },
                { key: 'limitations', label: 'Limitation Changes', count: comparison.limitations.length },
                { key: 'stale', label: 'Stale Customer Statements', count: comparison.staleStatements.length },
              ].map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <input
                      type="checkbox"
                      checked={activeFilters[item.key]}
                      onChange={() => toggleFilter(item.key)}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                    <span className="body-md" style={{ fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', fontWeight: 600 }}>{item.count} items</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 8 }}>
              <button
                className="code-sm"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setActiveFilters({ features: true, bugFixes: true, behaviour: true, limitations: true, stale: true })}
              >
                Reset All Filters
              </button>
              <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Item PR/Bug Detail Modal */}
      {itemDetailModal && (
        <div className="compare-modal-overlay" onClick={() => setItemDetailModal(null)}>
          <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>description</span>
                <div>
                  <h3 className="headline-sm">{itemDetailModal.type}: {itemDetailModal.id}</h3>
                  <span className="code-sm" style={{ color: 'var(--secondary)' }}>Linked Artifact</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setItemDetailModal(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{itemDetailModal.title}</span>
              <p className="body-md">{itemDetailModal.description}</p>
              {itemDetailModal.commit && (
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Git Commit: <code>{itemDetailModal.commit}</code> (Merged into main)</span>
              )}
              {itemDetailModal.pr && (
                <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Pull Request: <code>{itemDetailModal.pr}</code></span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setItemDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Suggested Replacement Statement Modal */}
      {modalStatement && (
        <div className="compare-modal-overlay" onClick={() => setModalStatement(null)}>
          <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>verified</span>
                <div>
                  <h3 className="headline-sm">Suggested Replacement Statement</h3>
                  <span className="code-sm" style={{ color: 'var(--secondary)' }}>Target Document: {versionB} External Communications</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setModalStatement(null)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--tertiary)', fontWeight: 700 }}>Recommended AI Draft</span>
              <p className="body-md" style={{ fontWeight: 500 }}>"{modalStatement.replacement}"</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary" onClick={() => setModalStatement(null)}>Cancel</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  handleAcknowledge(modalStatement.id);
                  setModalStatement(null);
                }}
              >
                Accept & Overwrite Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
