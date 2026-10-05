import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import AIProcessingModal from '../components/AIProcessingModal.jsx';
import { useToast } from '../components/Toast.jsx';
import { downloadFile } from '../utils/download.js';
import '../css/dashboard.css';

const fallbackReleases = [
  { _id: '1', version: 'v2.4.0', name: 'Dashboard Improvements', commit: 'main@7f8a91', status: 'Needs Review', impact: 'HIGH', issuesCount: 3, updatedAt: '2026-10-03', author: 'Alex R.' },
  { _id: '2', version: 'v2.3.0', name: 'Authentication Update', commit: 'main@c481e0', status: 'Approved', impact: 'MEDIUM', issuesCount: 0, updatedAt: '2026-09-20', author: 'Sarah T.' },
  { _id: '3', version: 'v2.2.0', name: 'Performance Improvements', commit: 'main@1984fe', status: 'Approved', impact: 'LOW', issuesCount: 1, updatedAt: '2026-08-28', author: 'Marcus K.' },
  { _id: '4', version: 'v2.1.2', name: 'Security Patch & Hotfix', commit: 'hotfix@9a3d42', status: 'Approved', impact: 'LOW', issuesCount: 0, updatedAt: '2026-08-14', author: 'DevOps' },
  { _id: '5', version: 'v2.5.0-alpha', name: 'Billing & Subscription Engine', commit: 'feat/billing@ef7139', status: 'Analyzing', impact: 'HIGH', issuesCount: 5, updatedAt: '2026-10-03', author: 'AI Bot' },
];

const activityStream = [
  { id: 1, actor: 'AI Auditor', action: 'flagged 2 unverified claims', detail: 'Identified missing automated test coverage citation in PR #142', time: '12m ago', type: 'warning' },
  { id: 2, actor: 'Alex Rivera', action: 'requested sign-off', detail: 'Assigned QA Lead (Sarah T.) for readiness review on candidate v2.4.0', time: '1h ago', type: 'primary' },
  { id: 3, actor: 'GitHub Actions', action: 'passed verification', detail: 'Automated release check completed for branch main@7f8a91 with 1,248 tests green.', time: '3h ago', type: 'success' },
];

export default function Dashboard() {
  const [releases, setReleases] = useState(fallbackReleases);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [envFilter, setEnvFilter] = useState('All Environments');
  const [page, setPage] = useState(1);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiCurrentStep, setAiCurrentStep] = useState('');
  const [aiCompletedSteps, setAiCompletedSteps] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const pageSize = 5;
  const showToast = useToast();
  const navigate = useNavigate();

  const fetchReleases = () => {
    api.getReleases()
      .then((data) => {
        if (data && data.length > 0) setReleases(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const filtered = releases.filter((r) => {
    const matchSearch = !search || `${r.version} ${r.name} ${r.author}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Statuses' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportReport = () => {
    const reportData = JSON.stringify({
      generatedAt: new Date().toISOString(),
      platform: 'MediKiosk ReleasePilot',
      totalReleases: releases.length,
      filteredReleases: filtered,
      activity: activityStream,
    }, null, 2);
    downloadFile(`release-readiness-report-${new Date().toISOString().slice(0, 10)}.json`, reportData, 'application/json');
    showToast('Readiness report exported successfully');
  };

  const handleTriggerAnalysis = async (r, e) => {
    if (e) e.stopPropagation();
    setSelectedRelease(r);
    setAiModalOpen(true);
    setAiStatus('analyzing');
    setAiCurrentStep('validatePackage');
    setAiCompletedSteps([]);
    setAiError(null);

    try {
      const finalResult = await api.analyzeReleaseStream({ version: r.version, name: r.name }, (event) => {
        if (event.status === 'analyzing') {
          setAiStatus('analyzing');
          if (event.currentStep) setAiCurrentStep(event.currentStep);
          if (event.completedSteps) setAiCompletedSteps(event.completedSteps);
        } else if (event.status === 'completed') {
          setAiStatus('completed');
          if (event.result) setAiResult(event.result);
        } else if (event.status === 'failed') {
          setAiStatus('failed');
          setAiError(event.error || 'AI analysis failed');
        }
      });

      setAiResult(finalResult);
      setAiStatus('completed');
      showToast(`AI Analysis complete for ${r.version}`);
    } catch (err) {
      setAiStatus('failed');
      setAiError(err.message || 'Unable to complete AI analysis. Please check your AI configuration and try again.');
    }
  };

  const handleDeleteRelease = async (id, version, e) => {
    e.stopPropagation();
    try {
      await api.deleteRelease(id);
    } catch (err) {
      showToast(`Could not delete ${version}: ${err.message}`);
      return;
    }
    setReleases((prev) => prev.filter((r) => r._id !== id));
    showToast(`Release ${version} removed`);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <h1 className="headline-lg">Release Readiness</h1>
            <span className="badge badge-neutral">
              <span className="dot" style={{ background: 'var(--primary-container)' }} />
              Production Ring 0
            </span>
          </div>
          <p className="body-md" style={{ color: 'var(--secondary)' }}>
            Review, validate, and communicate your software releases with confidence.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={handleExportReport}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>file_download</span>
            Export Report
          </button>
          <Link to="/create" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Release
          </Link>
        </div>
      </div>

      <div className="dashboard-alert">
        <div className="dashboard-alert-content">
          <div className="dashboard-alert-left">
            <div className="dashboard-alert-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>verified_user</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <span className="headline-sm">AI Readiness Alert:</span>
                <span className="body-md">
                  Release <code>v2.4.0</code> has <strong style={{ color: 'var(--warning)' }}>2 unsupported claims</strong> and <strong style={{ color: 'var(--warning)' }}>1 missing QA detail</strong>.
                </span>
              </div>
              <p className="body-sm" style={{ color: 'var(--secondary)', marginTop: 2 }}>
                Automated diff checks flagged unverified release notes against commits 4b18c and 9e20a.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexShrink: 0, alignSelf: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', animation: 'pulse 2s infinite' }} />
              <span className="code-sm" style={{ fontWeight: 600, letterSpacing: '0.02em' }}>Score: 78%</span>
            </div>
            <Link to="/analysis" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 500, fontSize: '0.8125rem' }}>
              Inspect AI Findings
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-4">
        <StatCard label="Total Releases" value={releases.length.toString()} icon="rocket_launch" trend={{ text: '+3 this month', color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' }} sub={{ label: 'Active pipelines', value: '4 active' }} />
        <StatCard label="Awaiting Review" value="3" icon="pending_actions" iconColor="var(--warning)" trend={{ text: 'Action Required', color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' }} sub={{ label: 'Unverified claims', value: '8 total statements', color: 'var(--warning)' }} />
        <StatCard label="High Impact Changes" value="5" icon="bolt" iconColor="var(--primary)" sub={{ label: 'Scope impact', value: '2 user-facing' }} />
        <StatCard label="Issues Detected" value="4" icon="error" iconColor="var(--danger)" trend={{ text: 'Needs Attention', color: 'var(--danger)', bg: 'var(--danger-bg)', border: 'var(--danger-border)' }} sub={{ label: 'Audit categorization', value: '2 claim - 1 QA - 1 stale' }} />
      </div>

      <div className="dashboard-table-card">
        <div className="dashboard-filter-bar">
          <div className="dashboard-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input className="dashboard-search-input" placeholder="Filter by version, author, or branch..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="dashboard-filters">
            <select className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: 32, fontSize: '0.75rem' }}>
              <option>All Statuses</option>
              <option>Needs Review</option>
              <option>Approved</option>
              <option>Analyzing</option>
              <option>Draft</option>
            </select>
            <select className="select" value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} style={{ height: 32, fontSize: '0.75rem' }}>
              <option>All Environments</option>
              <option>Production</option>
              <option>Staging</option>
              <option>Internal QA</option>
            </select>
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => { fetchReleases(); showToast('List reloaded'); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync</span>
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Release Name & Commit</th>
                <th>Status</th>
                <th>Impact</th>
                <th>Issues Detected</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r._id}>
                  <td><span className="code-md" style={{ fontWeight: 600 }}>{r.version}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="label-md" style={{ fontWeight: 600 }}>{r.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>commit</span>
                        <span className="code-sm" style={{ color: 'var(--secondary)' }}>{r.commit}</span>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <span className={`impact-${r.impact ? r.impact.toLowerCase() : 'medium'}`}>{r.impact || 'MEDIUM'}</span>
                  </td>
                  <td>
                    {r.issuesCount > 0 ? (
                      <span className="badge badge-warning">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                        {r.issuesCount} issues
                      </span>
                    ) : (
                      <span className="code-sm" style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>0 issues</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{new Date(r.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>{r.author || 'Dev Team'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleTriggerAnalysis(r, e)}
                        title="Trigger AI Release Analysis"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>auto_awesome</span>
                        Analyze
                      </button>
                      {r.status === 'Needs Review' ? (
                        <Link to="/review" className="btn btn-primary btn-sm">Review</Link>
                      ) : r.status === 'Analyzing' ? (
                        <span className="btn btn-sm" style={{ background: 'var(--surface-container)', color: 'var(--secondary)', cursor: 'not-allowed' }}>Queued</span>
                      ) : (
                        <Link to="/versions" className="btn btn-secondary btn-sm">View</Link>
                      )}
                      <button
                        className="icon-btn"
                        style={{ width: 'auto', height: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
                        onClick={(e) => handleDeleteRelease(r._id, r.version, e)}
                        title="Delete release"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--danger)' }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dashboard-table-footer">
          <span>Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> releases</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>
      </div>

      <div className="layout-grid">
        <div className="dashboard-activity col-7">
          <div className="dashboard-activity-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--secondary)' }}>history</span>
              <h2 className="headline-sm">Activity Stream</h2>
            </div>
            <span className="code-sm" style={{ color: 'var(--secondary)' }}>Live Audit Log</span>
          </div>
          <div className="dashboard-activity-list">
            {activityStream.map((item) => (
              <div key={item.id} className="dashboard-activity-item">
                <div className="dashboard-activity-avatar" style={{
                  background: item.type === 'warning' ? 'var(--warning-bg)' : item.type === 'success' ? 'var(--success-bg)' : 'var(--primary-fixed)',
                  color: item.type === 'warning' ? 'var(--warning)' : item.type === 'success' ? 'var(--success)' : 'var(--primary)',
                  border: `1px solid ${item.type === 'warning' ? 'var(--warning-border)' : item.type === 'success' ? 'var(--success-border)' : 'var(--primary-fixed-dim)'}`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {item.type === 'warning' ? 'flag' : item.type === 'success' ? 'check_circle' : 'rule'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                    <span className="label-md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{item.actor}</strong> {item.action}
                    </span>
                    <span className="body-sm" style={{ color: 'var(--secondary)', flexShrink: 0 }}>{item.time}</span>
                  </div>
                  <p className="body-sm" style={{ color: 'var(--secondary)', marginTop: 2 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-health col-5">
          <div>
            <div className="dashboard-health-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--secondary)' }}>health_and_safety</span>
                <h2 className="headline-sm">Release Health Matrix</h2>
              </div>
              <span className="badge badge-success" style={{ fontWeight: 600 }}>Healthy</span>
            </div>
            <div className="dashboard-health-score">
              <div>
                <span className="body-sm" style={{ color: 'var(--secondary)' }}>Overall Evidence Coverage</span>
                <div className="headline-xl" style={{ fontWeight: 600 }}>82%</div>
              </div>
              <ProgressRing value={82} size={56} color="var(--primary-container)">
                <span className="material-symbols-outlined" style={{ position: 'absolute', fontSize: 18, color: 'var(--primary)' }}>verified</span>
              </ProgressRing>
            </div>
            <div className="dashboard-health-bars">
              {[
                { label: 'Automated Diff Validation', value: 94, color: 'var(--success)' },
                { label: 'AI Claim Backing', value: 78, color: 'var(--warning)' },
                { label: 'Regression Sign-off', value: 100, color: 'var(--success)' },
              ].map((bar) => (
                <div key={bar.label} className="dashboard-health-bar-row">
                  <div className="dashboard-health-bar-labels">
                    <span>{bar.label}</span>
                    <span className="code-sm" style={{ fontWeight: 600 }}>{bar.value}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${bar.value}%`, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-health-footer">
            <span className="body-sm" style={{ color: 'var(--secondary)' }}>Next automatic gate check</span>
            <span className="code-sm" style={{ fontWeight: 600 }}>Today @ 18:00 UTC</span>
          </div>
        </div>
      </div>

      <AIProcessingModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        status={aiStatus}
        currentStep={aiCurrentStep}
        completedSteps={aiCompletedSteps}
        error={aiError}
        result={aiResult}
        onStart={() => selectedRelease && handleTriggerAnalysis(selectedRelease)}
        onViewAnalysis={() => {
          setAiModalOpen(false);
          navigate('/analysis', {
            state: {
              analysis: aiResult,
              version: selectedRelease?.version || 'v2.4.0',
              name: selectedRelease?.name || 'Release Analysis',
            },
          });
        }}
        onRetry={() => selectedRelease && handleTriggerAnalysis(selectedRelease)}
      />
    </div>
  );
}
