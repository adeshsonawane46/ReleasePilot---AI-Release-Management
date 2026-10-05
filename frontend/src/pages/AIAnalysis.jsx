import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import AIProcessingModal from '../components/AIProcessingModal.jsx';
import { downloadFile } from '../utils/download.js';
import '../css/analysis.css';

const DRAFT_KEY = 'releasepilot.analysisDraft.v2.4.0';
const MODEL_NAME = 'Pilot-DeepSync v4';

const fallbackAnalysis = {
  evidenceCoverage: 82,
  supportedClaims: 11,
  totalClaims: 13,
  flaggedRisks: 2,
  staleStatements: 1,
  unsupportedClaims: [
    {
      claim: 'PDF export works on all browsers.',
      evidence: 'PDF export was tested only on Chrome v118.',
      analysis: 'The supplied QA evidence does not support the claim of multi-browser parity. Safari is already flagged with WebKit canvas rendering issue #849, and zero Firefox test runs were logged.',
      severity: 'High',
    },
  ],
  impacts: [
    { title: 'PDF Export', level: 'HIGH IMPACT', description: 'Directly affects an end-user capability. Users will notice new action buttons in standard navigation and export workflows.', linkedItem: 'Feature #1', pr: 'PR #402', audience: 'All Users, Admins' },
    { title: 'Dark Mode', level: 'MEDIUM IMPACT', description: 'Changes the visual user interface experience and theme preference persistence across browser sessions.', linkedItem: 'Feature #2', pr: 'PR #418', audience: 'Developers' },
    { title: 'Logging Improvement', level: 'LOW IMPACT', description: 'Primarily affects internal diagnostics and error reporting; zero end-user workflow interruption.', linkedItem: 'Bug Fix #2', pr: 'PR #431', audience: 'Internal Engineers' },
  ],
  risks: [
    { id: 'RISK-01', severity: 'MEDIUM RISK', title: 'PDF export has only been tested on Chrome.', description: 'Incomplete validation creates potential for client-side rasterization failures on WebKit/Gecko layout engines.', mitigation: 'Display beta badge or limit rollout to Chrome user cohort initially via LaunchDarkly flag.' },
    { id: 'RISK-02', severity: 'LOW RISK', title: 'Session timeout increase to 60m may increase concurrent redis memory footprint.', description: 'Extended TTL preserves abandoned tokens longer, raising base memory cache ceiling by approximately 18%.', mitigation: 'Monitor Redis cluster RAM utilization post-deployment; configure dynamic eviction alerts in Datadog.' },
  ],
  missingInfo: [
    { title: 'QA evidence does not specify Firefox compatibility', severity: 'Medium Severity', description: 'Feature #1 specifies PDF Export, but QA Summary evidence only confirms Chrome testing. No Firefox or Edge test artifacts were provided in the build pipelines.', recommendation: 'Execute test suite on Firefox 119 or document Firefox as an unverified platform before customer release.' },
  ],
};

const baseCitationNodes = [
  { id: 1, label: 'NODE 01', title: 'Feature #1: PDF Export', desc: 'Core client rendering update', tags: ['2 QA Links', 'PR #402'], color: 'var(--primary)', status: 'verified' },
  { id: 2, label: 'NODE 02', title: 'QA Evidence #3: Chrome 118', desc: 'Automated Puppeteer suites', tags: ['Verified', '38 assertions passed'], color: 'var(--tertiary-container)', status: 'verified' },
  { id: 3, label: 'NODE 03', title: 'Limitation #1: Safari WebKit', desc: 'Canvas dimensions clipping', tags: ['Linked to Risk #1', 'Bug #849'], color: 'var(--error)', status: 'risk' },
];

export default function AIAnalysis() {
  const location = useLocation();
  const initialAnalysisData = useMemo(() => {
    if (location.state?.analysis) return location.state.analysis;
    try {
      const stored = window.sessionStorage.getItem('releasepilot.latestAnalysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.analysis) return parsed.analysis;
      }
    } catch {}
    return fallbackAnalysis;
  }, [location.state]);

  const [analysis, setAnalysis] = useState(() => initialAnalysisData);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiCurrentStep, setAiCurrentStep] = useState('');
  const [aiCompletedSteps, setAiCompletedSteps] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [runMeta, setRunMeta] = useState({ statements: 14, seconds: 1.8, model: MODEL_NAME, at: null });
  const [citationNodes, setCitationNodes] = useState(baseCitationNodes);
  const [dagRefreshedAt, setDagRefreshedAt] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [exceptionFor, setExceptionFor] = useState(null);
  const [exceptionNote, setExceptionNote] = useState('');
  const [qaRequested, setQaRequested] = useState({});
  const [exceptions, setExceptions] = useState({});
  const [claimLog, setClaimLog] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const startedAt = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    if (location.state?.analysis) {
      setAnalysis((prev) => ({ ...prev, ...location.state.analysis }));
    }
  }, [location.state]);

  const activeClaim = analysis.unsupportedClaims[0] ?? null;

  const severityCounts = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    analysis.risks.forEach((r) => {
      if (r.severity.includes('HIGH')) counts.HIGH += 1;
      else if (r.severity.includes('MEDIUM')) counts.MEDIUM += 1;
      else counts.LOW += 1;
    });
    return counts;
  }, [analysis.risks]);

  const coverageSegments = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (analysis.evidenceCoverage > i * 20 ? 1 : 0)),
    [analysis.evidenceCoverage]
  );

  const totalClaimsScored = useMemo(
    () => analysis.supportedClaims + analysis.unsupportedClaims.length,
    [analysis.supportedClaims, analysis.unsupportedClaims.length]
  );

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiModalOpen(true);
    setAiStatus('analyzing');
    setAiCurrentStep('validatePackage');
    setAiCompletedSteps([]);
    setAiError(null);
    startedAt.current = Date.now();

    try {
      const payload = location.state?.releaseData || { version: 'v2.4.0', name: 'Dashboard Improvements' };
      const finalResult = await api.analyzeReleaseStream(payload, (event) => {
        if (event.status === 'analyzing') {
          setAiStatus('analyzing');
          if (event.currentStep) setAiCurrentStep(event.currentStep);
          if (event.completedSteps) setAiCompletedSteps(event.completedSteps);
        } else if (event.status === 'completed') {
          setAiStatus('completed');
          if (event.result) {
            setAiResult(event.result);
            setAnalysis((prev) => ({ ...prev, ...event.result }));
          }
        } else if (event.status === 'failed') {
          setAiStatus('failed');
          setAiError(event.error || 'AI analysis failed');
        }
      });

      if (finalResult && typeof finalResult === 'object') {
        setAnalysis((prev) => ({ ...prev, ...finalResult }));
        setAiResult(finalResult);
        setAiStatus('completed');
      }
      const seconds = startedAt.current ? ((Date.now() - startedAt.current) / 1000).toFixed(1) : '1.8';
      setRunMeta((prev) => ({ ...prev, seconds, statements: totalClaimsScored, at: new Date().toISOString() }));
      showToast('AI analysis complete');
    } catch (err) {
      setAiStatus('failed');
      setAiError(err.message || 'Unable to complete AI analysis. Please check your AI configuration and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      run: runMeta,
      metrics: {
        evidenceCoverage: analysis.evidenceCoverage,
        supportedClaims: analysis.supportedClaims,
        totalClaims: analysis.totalClaims,
        flaggedRisks: analysis.flaggedRisks,
        staleStatements: analysis.staleStatements,
      },
      unsupportedClaims: analysis.unsupportedClaims,
      resolvedClaims: claimLog,
      impacts: analysis.impacts,
      risks: analysis.risks,
      missingInfo: analysis.missingInfo,
      qaRequests: qaRequested,
      exceptions,
      citationNodes,
    };
    downloadFile(`release-analysis-v2.4.0-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showToast('Analysis JSON downloaded');
  }, [analysis, runMeta, claimLog, qaRequested, exceptions, citationNodes, showToast]);

  const openEditClaim = useCallback(() => {
    setEditDraft(activeClaim?.claim ?? '');
    setEditOpen(true);
  }, [activeClaim]);

  const saveClaimEdit = useCallback(() => {
    const trimmed = editDraft.trim();
    if (!trimmed) {
      showToast('Claim text cannot be empty');
      return;
    }
    const previous = activeClaim?.claim ?? '';
    setAnalysis((prev) => ({
      ...prev,
      unsupportedClaims: prev.unsupportedClaims.map((c, i) => (i === 0 ? { ...c, claim: trimmed } : c)),
    }));
    setClaimLog((prev) => [...prev, { action: 'edited', from: previous, to: trimmed, at: new Date().toISOString() }]);
    setEditOpen(false);
    showToast('Statement updated - re-run analysis to verify');
  }, [editDraft, activeClaim, showToast]);

  const applyOverride = useCallback(() => {
    const reason = overrideReason.trim();
    if (reason.length < 10) {
      showToast('Justification must be at least 10 characters');
      return;
    }
    const claim = activeClaim?.claim ?? '';
    setAnalysis((prev) => ({ ...prev, unsupportedClaims: prev.unsupportedClaims.slice(1) }));
    setClaimLog((prev) => [...prev, { action: 'overridden', claim, reason, at: new Date().toISOString() }]);
    setOverrideReason('');
    setOverrideOpen(false);
    showToast('Claim overridden and released from the blocking gate');
  }, [overrideReason, activeClaim, showToast]);

  const dismissClaim = useCallback(() => {
    const claim = activeClaim?.claim ?? '';
    setAnalysis((prev) => ({ ...prev, unsupportedClaims: prev.unsupportedClaims.slice(1) }));
    setClaimLog((prev) => [...prev, { action: 'dismissed', claim, at: new Date().toISOString() }]);
    showToast('Claim dismissed');
  }, [activeClaim, showToast]);

  const requestQaTest = useCallback((title) => {
    setQaRequested((prev) => ({ ...prev, [title]: true }));
    showToast(`QA rerun requested for "${title}"`);
  }, [showToast]);

  const openException = useCallback((title) => {
    setExceptionNote('');
    setExceptionFor(title);
  }, []);

  const saveException = useCallback(() => {
    const note = exceptionNote.trim();
    if (!note) {
      showToast('Exception note is required');
      return;
    }
    const target = exceptionFor;
    setExceptions((prev) => ({ ...prev, [target]: [...(prev[target] || []), { note, at: new Date().toISOString() }] }));
    setExceptionFor(null);
    setExceptionNote('');
    showToast('Exception logged');
  }, [exceptionNote, exceptionFor, showToast]);

  const refreshDag = useCallback(() => {
    const riskLinked = new Set(analysis.risks.map((r) => r.id));
    setCitationNodes((prev) => prev.map((n) => {
      if (n.status === 'risk' && riskLinked.size === 0) return { ...n, status: 'partial' };
      return n;
    }));
    setDagRefreshedAt(new Date().toISOString());
    showToast(`DAG matrix re-indexed against ${analysis.risks.length} risk link(s)`);
  }, [analysis.risks, showToast]);

  const saveDraft = useCallback(() => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ analysis, claimLog, qaRequested, exceptions, citationNodes, runMeta, savedAt: new Date().toISOString() }));
      setSavedAt(new Date().toISOString());
      showToast('Draft saved to session storage');
    } catch {
      showToast('Could not save draft: session storage unavailable');
    }
  }, [analysis, claimLog, qaRequested, exceptions, citationNodes, runMeta, showToast]);

  return (
    <div className="page-container analysis-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      <div className="analysis-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="analysis-context-badges">
            <span className="badge badge-neutral" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>commit</span>
              <strong>v2.4.0 — Dashboard Improvements</strong>
            </span>
            <span style={{ color: 'var(--outline)' }} className="code-sm">/</span>
            <span className="badge" style={{ background: 'var(--surface-container-low)', color: 'var(--secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fork_right</span>
              release/v2.4
            </span>
          </div>
          <div className="analysis-title-row">
            <h1 className="headline-xl" style={{ letterSpacing: '-0.025em' }}>AI Release Analysis</h1>
            <div className="analysis-status-pill">
              <span className="analysis-ping-dot" />
              <span className="label-sm" style={{ fontWeight: 600 }}>{analyzing ? 'Analyzing' : 'Analysis Complete'}</span>
              <span style={{ color: 'var(--outline)' }} className="label-sm">-</span>
              <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {runMeta.statements} statements in {runMeta.seconds}s with {runMeta.model}
              </span>
            </div>
          </div>
        </div>
        <div className="analysis-actions">
          <button className="btn btn-secondary" onClick={handleDownloadJson}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--secondary)' }}>data_object</span>
            Download Analysis JSON
          </button>
          <button className="btn btn-secondary" onClick={handleAnalyze} disabled={analyzing}>
            <span className={`material-symbols-outlined ${analyzing ? 'loading-spinner' : ''}`} style={{ fontSize: 18, color: 'var(--secondary)' }}>cached</span>
            {analyzing ? 'Analyzing...' : 'Re-run Analysis'}
          </button>
          <Link to="/briefs" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_read_pause</span>
            Generate Release Briefs
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Evidence Coverage</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary-container)' }}>verified</span>
          </div>
          <div className="analysis-metric-value">
            <span className="headline-xl" style={{ fontWeight: 600 }}>{analysis.evidenceCoverage}%</span>
            <span className="label-sm" style={{ color: 'var(--secondary)', fontWeight: 500 }}>target &ge; 80%</span>
          </div>
          <div className="analysis-segmented-bar">
            {coverageSegments.map((filled, i) => (
              <div key={i} className="analysis-segment" style={{ background: filled ? 'var(--tertiary-container)' : 'var(--surface-container-highest)' }} />
            ))}
          </div>
          <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-sm)' }}>
            {analysis.evidenceCoverage}% of important release statements have supporting QA telemetry.
          </p>
        </div>

        <div className="analysis-metric-card">
          <div className="analysis-metric-label">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Supported Claims</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>fact_check</span>
          </div>
          <div className="analysis-metric-value">
            <span className="headline-xl" style={{ fontWeight: 600 }}>
              {analysis.supportedClaims} <span style={{ color: 'var(--secondary)', fontWeight: 400, fontSize: '1.25rem' }}>/ {analysis.totalClaims}</span>
            </span>
            <span className="badge badge-neutral" style={{ fontWeight: 600 }}>{((analysis.supportedClaims / analysis.totalClaims) * 100).toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary-container)' }} />
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{analysis.supportedClaims} verified with primary PR citations</p>
          </div>
        </div>

        <div className="analysis-metric-card">
          <div className="analysis-metric-label">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Flagged Risks</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--error)' }}>warning</span>
          </div>
          <div className="analysis-metric-value">
            <span className="headline-xl" style={{ fontWeight: 600, color: 'var(--error)' }}>{analysis.flaggedRisks}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {severityCounts.MEDIUM > 0 && <span className="badge badge-warning" style={{ fontWeight: 600 }}>{severityCounts.MEDIUM} Med</span>}
              {severityCounts.LOW > 0 && <span className="badge badge-neutral" style={{ fontWeight: 600 }}>{severityCounts.LOW} Low</span>}
              {severityCounts.HIGH > 0 && <span className="badge badge-danger" style={{ fontWeight: 600 }}>{severityCounts.HIGH} High</span>}
            </div>
          </div>
          <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Browser compatibility gate triggered</p>
        </div>

        <div className="analysis-metric-card">
          <div className="analysis-metric-label">
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Stale Statements</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--secondary)' }}>schedule</span>
          </div>
          <div className="analysis-metric-value">
            <span className="headline-xl" style={{ fontWeight: 600 }}>{analysis.staleStatements}</span>
            <span className="body-sm" style={{ color: 'var(--secondary)' }}>detected from sprint 44</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)' }} />
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Needs spec synchronisation</p>
          </div>
        </div>
      </div>

      {analysis.unsupportedClaims.length > 0 && (
        <div className="analysis-callout">
          <div className="analysis-callout-glow" />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)', zIndex: 10, flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--error-container)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>gpp_maybe</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="label-sm" style={{ fontWeight: 600, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Unsupported Claim Detected</span>
                <span className="badge badge-danger" style={{ fontWeight: 600 }}>Blocking Release</span>
              </div>
              <div className="grid grid-2" style={{ background: 'var(--surface-container-lowest)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', fontWeight: 600 }}>Proposed Claim</span>
                  <p className="headline-sm">"{analysis.unsupportedClaims[0].claim}"</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase', fontWeight: 600 }}>Provided Evidence</span>
                  <p className="body-md" style={{ color: 'var(--secondary)' }}>"{analysis.unsupportedClaims[0].evidence}"</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>neurology</span>
                  <span className="label-md" style={{ fontWeight: 600 }}>AI Auditor Analysis:</span>
                </div>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)', lineHeight: '1.5rem' }}>{analysis.unsupportedClaims[0].analysis}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: 192, zIndex: 10 }}>
            <button className="btn btn-secondary" onClick={openEditClaim}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
              Edit Statement
            </button>
            <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={() => { setOverrideReason(''); setOverrideOpen(true); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
              Override Justify
            </button>
            <button className="btn btn-danger" onClick={dismissClaim}>Dismiss Claim</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>groups</span>
            <h2 className="headline-md" style={{ letterSpacing: '-0.015em' }}>User Impact Analysis</h2>
          </div>
          <span className="label-sm" style={{ color: 'var(--secondary)' }}>{analysis.impacts.length} key surface areas identified</span>
        </div>
        <div className="grid grid-3">
          {analysis.impacts.map((impact) => (
            <div key={impact.title} className="analysis-impact-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="headline-sm">{impact.title}</span>
                  <span className={`badge ${impact.level === 'HIGH IMPACT' ? 'badge-danger' : impact.level === 'MEDIUM IMPACT' ? 'badge-info' : 'badge-neutral'}`}>
                    <span className="dot" />
                    {impact.level}
                  </span>
                </div>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)', lineHeight: '1.5rem' }}>{impact.description}</p>
              </div>
              <div className="analysis-impact-footer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--secondary)' }} className="label-sm">
                  <span style={{ fontWeight: 500 }}>Linked: {impact.linkedItem}</span>
                  <span className="code-sm" style={{ background: 'var(--surface-container)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{impact.pr}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="label-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--secondary)' }}>account_tree</span>
                  <span>Audience: {impact.audience}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--secondary)' }}>flaky</span>
            <h2 className="headline-md" style={{ letterSpacing: '-0.015em' }}>Missing Information & Gaps</h2>
          </div>
          <span className="code-sm" style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--secondary)' }}>{analysis.missingInfo.length} actionable item</span>
        </div>
        {analysis.missingInfo.map((info) => {
          const requested = !!qaRequested[info.title];
          const logged = (exceptions[info.title] || []).length;
          return (
          <div key={info.title} className="card" style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-lg)', flex: 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notification_important</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <h3 className="headline-sm">{info.title}</h3>
                  <span className="badge badge-info" style={{ fontWeight: 600 }}>{info.severity}</span>
                </div>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)', lineHeight: '1.5rem' }}>{info.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--surface-container-low)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', marginTop: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)', flexShrink: 0 }}>lightbulb</span>
                  <span className="body-sm"><strong>Recommended Action:</strong> {info.recommendation}</span>
                </div>
                {(requested || logged > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 4 }}>
                    {requested && (
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>science</span>
                        QA rerun queued
                      </span>
                    )}
                    {logged > 0 && (
                      <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>playlist_add_check</span>
                        {logged} exception{logged === 1 ? '' : 's'} logged
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignSelf: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => requestQaTest(info.title)} disabled={requested}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{requested ? 'check' : 'science'}</span>
                {requested ? 'QA Test Requested' : 'Request QA Test'}
              </button>
              <button className="btn btn-secondary" onClick={() => openException(info.title)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>playlist_add_check</span>
                Add Exception
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--error)' }}>security_update_warning</span>
            <h2 className="headline-md" style={{ letterSpacing: '-0.015em' }}>Risks & Identified Limitations</h2>
          </div>
          <span className="label-sm" style={{ color: 'var(--secondary)' }}>{analysis.risks.length} mitigation strategies assigned</span>
        </div>
        <div className="grid grid-2">
          {analysis.risks.map((risk) => (
            <div key={risk.id} className="analysis-risk-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`badge ${risk.severity.includes('MEDIUM') ? 'badge-info' : 'badge-neutral'}`}>
                    <span className="dot" />
                    {risk.severity}
                  </span>
                  <span className="code-sm" style={{ color: 'var(--outline)' }}>{risk.id}</span>
                </div>
                <h3 className="headline-sm">{risk.title}</h3>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{risk.description}</p>
              </div>
              <div className="analysis-mitigation">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary-container)', flexShrink: 0, marginTop: 2 }}>shield</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="label-sm" style={{ fontWeight: 600 }}>Mitigation Strategy</span>
                  <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{risk.mitigation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>account_tree</span>
            <h2 className="headline-md" style={{ letterSpacing: '-0.015em' }}>Evidence Source Citations & References Map</h2>
          </div>
          <span className="label-sm" style={{ color: 'var(--secondary)' }}>Telemetry DAG View</span>
        </div>
        <div className="card analysis-citation-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', padding: 'var(--space-2xl)', background: 'rgba(242, 243, 255, 0.5)', margin: 'calc(-1 * var(--space-2xl))', paddingBottom: 'var(--space-2xl)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0 }}>
              <span className="label-md" style={{ fontWeight: 600 }}>Interactive Citation Trace</span>
              <span className="badge badge-neutral">v2.4 Graph Index</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-md)' }} className="code-sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary-container)' }} /> Verified
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)' }} /> Partial
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error)' }} /> Risk Linked
              </span>
            </div>
          </div>
          <div className="grid grid-3" style={{ alignItems: 'stretch', paddingTop: 'var(--space-sm)' }}>
            {citationNodes.map((node) => (
              <div key={node.id} className="analysis-citation-node">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="code-sm" style={{ fontWeight: 600, color: node.color }}>{node.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--secondary)' }}>
                    {node.id === 1 ? 'extension' : node.id === 2 ? 'task_alt' : 'bug_report'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="headline-sm">{node.title}</span>
                  <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{node.desc}</p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  {node.tags.map((tag) => (
                    <span key={tag} className="badge badge-neutral" style={{ background: 'var(--surface-container-highest)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', paddingTop: 'var(--space-lg)', background: 'var(--surface-container-lowest)', color: 'var(--secondary)' }} className="body-sm">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
              <span>All source nodes are permanently hashed against Git commit <code>d98a2fe</code> for audit compliance.</span>
              {dagRefreshedAt && (
                <span className="code-sm" style={{ color: 'var(--outline)' }}>
                  Re-indexed {new Date(dagRefreshedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button className="label-sm" style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={refreshDag}>
              Refresh DAG Matrix
            </button>
          </div>
        </div>
      </div>

      <div className="analysis-sticky-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="label-md" style={{ fontWeight: 600 }}>
              {activeClaim ? `Resolve ${analysis.unsupportedClaims.length} blocking claim(s) before drafting briefs` : 'All blocking claims resolved - ready to draft'}
            </span>
            <span className="body-sm" style={{ color: 'var(--secondary)' }}>
              AI analysis has cataloged {analysis.totalClaims} claims and generated risk mitigations.
              {savedAt && ` Draft saved ${new Date(savedAt).toLocaleTimeString()}.`}
            </span>
          </div>
        </div>
        <div className="action-row">
          <button className="btn btn-secondary" onClick={saveDraft}>Save Draft</button>
          <Link to="/briefs" className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_stories</span>
            Generate Release Briefs
          </Link>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Statement"
        icon="edit_note"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveClaimEdit}>Save Statement</button>
          </>
        )}
      >
        <div className="modal-field">
          <span className="modal-label">Provided Evidence (read only)</span>
          <p className="body-sm" style={{ color: 'var(--secondary)' }}>{activeClaim?.evidence ?? 'No evidence recorded'}</p>
        </div>
        <div className="modal-field">
          <span className="modal-label">Reworded Claim</span>
          <textarea
            className="input"
            rows={3}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            placeholder="State only what the evidence supports"
          />
          <span className="modal-hint">Removing the unsupported scope (for example &quot;all browsers&quot;) lets the claim pass review.</span>
        </div>
      </Modal>

      <Modal
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        title="Override AI Finding"
        icon="verified_user"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setOverrideOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={applyOverride}>Override &amp; Release</button>
          </>
        )}
      >
        <div className="modal-field">
          <span className="modal-label">Claim Being Overridden</span>
          <p className="headline-sm">&quot;{activeClaim?.claim ?? ''}&quot;</p>
        </div>
        <div className="modal-field">
          <span className="modal-label">Justification (required, min 10 characters)</span>
          <textarea
            className="input"
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why the AI finding is incorrect"
          />
          {overrideReason.trim().length > 0 && overrideReason.trim().length < 10 && (
            <span className="modal-error">{10 - overrideReason.trim().length} more characters needed</span>
          )}
        </div>
        <p className="modal-hint">The override and your justification are recorded in the export payload.</p>
      </Modal>

      <Modal
        open={exceptionFor !== null}
        onClose={() => setExceptionFor(null)}
        title="Log Exception"
        icon="playlist_add_check"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setExceptionFor(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveException}>Log Exception</button>
          </>
        )}
      >
        <div className="modal-field">
          <span className="modal-label">Gap</span>
          <p className="body-sm" style={{ color: 'var(--secondary)' }}>{exceptionFor}</p>
        </div>
        <div className="modal-field">
          <span className="modal-label">Exception Note</span>
          <textarea
            className="input"
            rows={3}
            value={exceptionNote}
            onChange={(e) => setExceptionNote(e.target.value)}
            placeholder="Why is this acceptable to ship without the missing evidence?"
          />
        </div>
      </Modal>

      <AIProcessingModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        status={aiStatus}
        currentStep={aiCurrentStep}
        completedSteps={aiCompletedSteps}
        error={aiError}
        result={aiResult}
        onStart={handleAnalyze}
        onViewAnalysis={() => setAiModalOpen(false)}
        onRetry={handleAnalyze}
      />
    </div>
  );
}
