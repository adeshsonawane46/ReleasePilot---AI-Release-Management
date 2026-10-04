import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import Menu from '../components/Menu.jsx';
import AIProcessingModal from '../components/AIProcessingModal.jsx';
import '../css/create.css';

const initialForm = {
  version: 'v2.4.0',
  branch: 'release/v2.4',
  name: 'Dashboard Improvements & PDF Reporting',
  targetDate: 'Oct 5, 2026',
};

const initialFeatures = [
  { title: 'PDF Export', description: 'Users can export reports as PDF directly from the dashboard view with customizable date ranges.', pr: 'PR #1402', tags: ['User-Facing', 'Core'], commits: 4, author: '@d-mendoza' },
  { title: 'Dark Mode Support', description: 'Comprehensive dark color scheme toggle for low-light developer workflows.', pr: 'PR #1419', tags: ['UI/UX'], commits: 7, author: '@s-patel' },
];

const initialBugFixes = [
  { title: 'Fixed login timeout issue', description: 'Resolved premature session expiration on inactive tabs.', bugId: 'BUG-982', commit: 'commit c9318b' },
  { title: 'Fixed incorrect dashboard calculations', description: 'Corrected aggregate sum rounding bug in daily metrics.', bugId: 'BUG-1044', commit: 'commit 5a201f' },
];

const initialEvidence = [
  { text: 'PDF export tested successfully on Chrome v118. Generated 50 sample reports without corruption.', artifact: 'pdf_matrix_run_302.log', verifiedBy: 'QA Bot' },
  { text: 'Login flow tested on Chrome and Firefox across 10 auth providers.', artifact: 'e2e_auth_cypress_v2.json', verifiedBy: 'Automation Suite' },
];

const initialBehaviourChange = 'Session timeout changed from 30 minutes to 60 minutes for active enterprise sessions.';

const initialLimitation = 'PDF export is currently unavailable on Safari due to WebKit canvas rendering bug #849.';

const initialMigrationNotes = ['prisma migrate deploy', 'REPORT_EXPORT_ENABLED=true'];

const initialQaStats = {
  testsExecuted: 482,
  testsPassed: 480,
  environment: 'Staging-US-East',
  browsers: 'Chrome 118, FF 119',
};

const sections = [
  { key: 'features', label: 'Completed Features', count: (ctx) => `${ctx.features} item${ctx.features === 1 ? '' : 's'}` },
  { key: 'bugs', label: 'Bug Fixes', count: (ctx) => `${ctx.bugFixes} item${ctx.bugFixes === 1 ? '' : 's'}` },
  { key: 'behaviour', label: 'Changed Behaviour', count: () => '1 item' },
  { key: 'qa', label: 'QA Summary', count: (ctx) => `${ctx.evidence} evidence attached` },
  { key: 'limitations', label: 'Known Limitations', count: () => '1 item flagged' },
  { key: 'migration', label: 'Migration Notes', count: (ctx) => `${ctx.migrationNotes} command${ctx.migrationNotes === 1 ? '' : 's'}` },
  { key: 'audiences', label: 'Affected User Groups', count: (ctx) => `${ctx.audiences} selected` },
];

export default function CreateRelease() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [features, setFeatures] = useState(initialFeatures);
  const [bugFixes, setBugFixes] = useState(initialBugFixes);
  const [evidence, setEvidence] = useState(initialEvidence);
  const [behaviourChange, setBehaviourChange] = useState(initialBehaviourChange);
  const [limitation, setLimitation] = useState(initialLimitation);
  const [migrationNotes, setMigrationNotes] = useState(initialMigrationNotes);
  const [qaStats, setQaStats] = useState(initialQaStats);
  const [audiences, setAudiences] = useState({ 'All Users': true, Admins: true, Developers: true, Support: false, 'Enterprise Customers': true });
  const [submitting, setSubmitting] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiCurrentStep, setAiCurrentStep] = useState('');
  const [aiCompletedSteps, setAiCompletedSteps] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [activeSection, setActiveSection] = useState('metadata');
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingBug, setEditingBug] = useState(null);
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [editingLimitation, setEditingLimitation] = useState(false);
  const showToast = useToast();

  const handleCopyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy');
    }
  }, [showToast]);

  const toggleAudience = useCallback((key) => {
    setAudiences((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleFeatureEdit = useCallback((index) => {
    setEditingFeature((prev) => (prev === index ? null : index));
  }, []);

  const duplicateFeature = useCallback((index) => {
    setFeatures((prev) => {
      const source = prev[index];
      const copy = { ...source, title: `${source.title} (copy)`, tags: [...source.tags] };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setEditingFeature(index + 1);
    showToast('Feature duplicated');
  }, [showToast]);

  const copyFeature = useCallback((index) => {
    const f = features[index];
    handleCopyText(`${f.pr} - ${f.title}\n${f.description}\nCommits: ${f.commits} | Author: ${f.author}`);
  }, [features, handleCopyText]);

  const addFeature = useCallback(() => {
    setFeatures((prev) => [
      ...prev,
      { title: 'New Feature', description: 'Describe the completed feature for this release.', pr: `PR #${1500 + prev.length}`, tags: ['User-Facing'], commits: 0, author: '@you' },
    ]);
    showToast('Feature added - edit it via the 3-dot menu');
  }, [showToast]);

  const removeFeature = useCallback((index) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
    setEditingFeature((prev) => (prev === null ? null : prev > index ? prev - 1 : prev === index ? null : prev));
    showToast('Feature removed');
  }, [showToast]);

  const featureMenuItems = useCallback((index) => [
    {
      label: editingFeature === index ? 'Finish editing' : 'Edit feature',
      icon: editingFeature === index ? 'check' : 'edit',
      onClick: () => toggleFeatureEdit(index),
    },
    { label: 'Duplicate', icon: 'content_copy', onClick: () => duplicateFeature(index) },
    { label: 'Copy as text', icon: 'format_list_bulleted', onClick: () => copyFeature(index) },
    { label: 'Remove feature', icon: 'delete', danger: true, onClick: () => removeFeature(index) },
  ], [editingFeature, toggleFeatureEdit, duplicateFeature, copyFeature, removeFeature]);

  const addBugFix = useCallback(() => {
    const nextIndex = bugFixes.length;
    setBugFixes((prev) => [
      ...prev,
      {
        title: 'New bug fix',
        description: 'Describe the defect that was resolved.',
        bugId: `BUG-${1100 + prev.length}`,
        commit: 'commit pending',
      },
    ]);
    setEditingBug(nextIndex);
    showToast('Bug fix added - edit it inline');
  }, [bugFixes.length, showToast]);

  const updateBugFix = useCallback((index, patch) => {
    setBugFixes((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }, []);

  const removeBugFix = useCallback((index) => {
    setBugFixes((prev) => prev.filter((_, i) => i !== index));
    setEditingBug((prev) => (prev === null ? null : prev > index ? prev - 1 : prev === index ? null : prev));
    showToast('Bug fix removed');
  }, [showToast]);

  const bugMenuItems = useCallback((index) => [
    {
      label: editingBug === index ? 'Finish editing' : 'Edit fix',
      icon: editingBug === index ? 'check' : 'edit',
      onClick: () => setEditingBug((prev) => (prev === index ? null : index)),
    },
    {
      label: 'Copy as text',
      icon: 'format_list_bulleted',
      onClick: () => {
        const b = bugFixes[index];
        handleCopyText(`${b.bugId} - ${b.title}\n${b.description}\n${b.commit}`);
      },
    },
    { label: 'Remove fix', icon: 'delete', danger: true, onClick: () => removeBugFix(index) },
  ], [editingBug, bugFixes, removeBugFix]);

  const addEvidence = useCallback(() => {
    const nextIndex = evidence.length;
    setEvidence((prev) => [
      ...prev,
      { text: 'Describe the verification performed for this release.', artifact: 'artifact_pending.log', verifiedBy: 'Unassigned' },
    ]);
    setEditingEvidence(nextIndex);
    showToast('QA evidence added - edit it inline');
  }, [evidence.length, showToast]);

  const updateEvidence = useCallback((index, patch) => {
    setEvidence((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }, []);

  const removeEvidence = useCallback((index) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
    setEditingEvidence((prev) => (prev === null ? null : prev > index ? prev - 1 : prev === index ? null : prev));
    showToast('QA evidence removed');
  }, [showToast]);

  const evidenceMenuItems = useCallback((index) => [
    {
      label: editingEvidence === index ? 'Finish editing' : 'Edit evidence',
      icon: editingEvidence === index ? 'check' : 'edit',
      onClick: () => setEditingEvidence((prev) => (prev === index ? null : index)),
    },
    {
      label: 'Copy as text',
      icon: 'format_list_bulleted',
      onClick: () => {
        const e = evidence[index];
        handleCopyText(`${e.text}\nartifact: ${e.artifact}\nverified by: ${e.verifiedBy}`);
      },
    },
    { label: 'Remove evidence', icon: 'delete', danger: true, onClick: () => removeEvidence(index) },
  ], [editingEvidence, evidence, removeEvidence]);

  const addMigrationNote = useCallback(() => {
    setMigrationNotes((prev) => [...prev, 'NEW_ENV_VAR=true']);
    showToast('Migration note added');
  }, [showToast]);

  const removeMigrationNote = useCallback((index) => {
    setMigrationNotes((prev) => prev.filter((_, i) => i !== index));
    showToast('Migration note removed');
  }, [showToast]);

  const loadTemplate = useCallback(() => {
    setForm({ ...initialForm });
    setFeatures(initialFeatures.map((f) => ({ ...f, tags: [...f.tags] })));
    setBugFixes(initialBugFixes.map((b) => ({ ...b })));
    setEvidence(initialEvidence.map((e) => ({ ...e })));
    setBehaviourChange(initialBehaviourChange);
    setLimitation(initialLimitation);
    setMigrationNotes([...initialMigrationNotes]);
    setQaStats({ ...initialQaStats });
    setAudiences({ 'All Users': true, Admins: true, Developers: true, Support: false, 'Enterprise Customers': true });
    setEditingFeature(null);
    setEditingBug(null);
    setEditingEvidence(null);
    setEditingLimitation(false);
    showToast('Template loaded into the release form');
  }, [showToast]);

  const navigateToAnalysis = useCallback((result, releasePayload) => {
    try {
      window.sessionStorage.setItem(
        'releasepilot.latestAnalysis',
        JSON.stringify({
          version: form.version,
          name: form.name,
          analysis: result,
          releaseData: releasePayload,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}
    navigate('/analysis', {
      state: { analysis: result, version: form.version, name: form.name, releaseData: releasePayload },
    });
  }, [form.version, form.name, navigate]);

  const handleSubmit = async (action) => {
    setSubmitting(true);
    const releasePayload = {
      ...form,
      status: action === 'analyze' ? 'Analyzing' : 'Draft',
      author: 'Alex Rivera',
      packageData: {
        features,
        bugFixes,
        behaviourChanges: [behaviourChange],
        qaSummary: {
          testsExecuted: qaStats.testsExecuted,
          testsPassed: qaStats.testsPassed,
          testsFailed,
          environment: qaStats.environment,
          browsers: qaStats.browsers,
          passRate: Number(passRateLabel),
          evidence,
        },
        knownLimitations: [limitation],
        migrationNotes,
        affectedGroups: Object.keys(audiences).filter((k) => audiences[k]),
        completeness,
      },
    };

    if (action === 'analyze') {
      setAiModalOpen(true);
      setAiStatus('analyzing');
      setAiCurrentStep('validatePackage');
      setAiCompletedSteps([]);
      setAiError(null);

      try {
        await api.createRelease(releasePayload);
        const finalResult = await api.analyzeReleaseStream(releasePayload, (event) => {
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
        showToast('AI release analysis generated successfully');
      } catch (err) {
        setAiStatus('failed');
        setAiError(err.message || 'Unable to complete AI analysis. Please check your AI configuration and try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        await api.createRelease(releasePayload);
        showToast('Draft saved successfully');
      } catch {
        showToast('Draft saved (local mode)');
      }
      setSubmitting(false);
      navigate('/');
    }
  };

  const activeAudienceCount = Object.values(audiences).filter(Boolean).length;

  const testsFailed = Math.max(0, qaStats.testsExecuted - qaStats.testsPassed);
  const passRate = qaStats.testsExecuted > 0 ? (qaStats.testsPassed / qaStats.testsExecuted) * 100 : 0;
  const passRateLabel = passRate.toFixed(2);
  const passRateWidth = Number(passRateLabel);

  const sectionComplete = {
    features: features.length > 0,
    bugs: bugFixes.length > 0,
    behaviour: behaviourChange.trim().length > 0,
    qa: evidence.length > 0,
    limitations: limitation.trim().length > 0,
    migration: migrationNotes.length > 0,
    audiences: activeAudienceCount > 0,
  };

  const completedSections = Object.values(sectionComplete).filter(Boolean).length;
  const completeness = Math.round((completedSections / sections.length) * 100);

  const checklistContext = {
    features: features.length,
    bugFixes: bugFixes.length,
    evidence: evidence.length,
    migrationNotes: migrationNotes.length,
    audiences: activeAudienceCount,
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 6 }}>
              <span className="badge badge-info">
                <span className="dot" style={{ background: 'var(--primary)' }} />
                PIPELINE: PROD-READY DRAFT
              </span>
              <span style={{ color: 'var(--outline-variant)' }} className="body-sm">/</span>
              <span className="code-sm" style={{ color: 'var(--secondary)' }}>workspace: cloud-core-app</span>
            </div>
            <h1 className="headline-xl" style={{ letterSpacing: '-0.025em' }}>Create Release</h1>
            <p className="body-md" style={{ color: 'var(--secondary)', marginTop: 4 }}>Provide the release package that will be analyzed by the AI assistant.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={loadTemplate}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
              Load Template
            </button>
            <button className="btn btn-secondary" onClick={() => showToast('Jira/PR import started')}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>import_export</span>
              Import Jira/PRs
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', alignItems: 'start' }}>
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className={`create-section ${activeSection === 'metadata' ? 'active' : ''}`} onClick={() => setActiveSection('metadata')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <div className="create-section-icon" style={{ background: 'var(--surface-container)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
                  </div>
                  <span className="headline-sm">Release Metadata & Anchors</span>
                </div>
                <span className="code-sm create-id-badge">ID: REL-2026-088</span>
              </div>
              <div className="grid grid-2" style={{ gap: 'var(--space-lg)' }}>
                {[
                  { key: 'version', label: 'Release Version', icon: 'tag', mono: true },
                  { key: 'branch', label: 'Target Branch', icon: 'fork_right', mono: true },
                  { key: 'name', label: 'Release Name', icon: 'label' },
                  { key: 'targetDate', label: 'Release Date / Target', icon: 'event' },
                ].map((field) => (
                  <div key={field.key} className="create-field-group">
                    <div className="create-field-label">
                      <label>{field.label}</label>
                      {field.key === 'version' && <span className="code-sm create-hint-badge">semver: patch/minor</span>}
                    </div>
                    <div className="create-input-wrap">
                      <span className="material-symbols-outlined create-input-icon">{field.icon}</span>
                      <input
                        className="input create-input"
                        style={{ fontFamily: field.mono ? 'var(--font-mono)' : 'var(--font-sans)' }}
                        value={form[field.key]}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`create-section ${activeSection === 'features' ? 'active' : ''}`} onClick={() => setActiveSection('features')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <span className="create-section-badge" style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)' }}>A</span>
                  <h2 className="headline-sm">Completed Features</h2>
                  <span className="code-sm create-count-badge">{features.length} documented</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); addFeature(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  Add Feature
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {features.map((f, i) => {
                  const isEditing = editingFeature === i;
                  return (
                  <div key={i} className={`create-feature-item ${isEditing ? 'editing' : ''}`}>
                    <div className="create-feature-header">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                          <span className="code-sm" style={{ color: 'var(--secondary)' }}>{f.pr}</span>
                          <span style={{ color: 'var(--outline)', fontSize: 12 }}>-</span>
                          {isEditing ? (
                            <input
                              className="headline-sm create-feature-title-input"
                              value={f.title}
                              autoFocus
                              onChange={(e) => {
                                const updated = [...features];
                                updated[i] = { ...updated[i], title: e.target.value };
                                setFeatures(updated);
                              }}
                            />
                          ) : (
                            <span className="headline-sm create-feature-title-static">{f.title}</span>
                          )}
                        </div>
                      </div>
                      <div className="create-feature-tags">
                        {f.tags.map((t) => (
                          <span key={t} className="create-tag" style={{ background: t === 'User-Facing' ? 'var(--primary-fixed)' : 'var(--secondary-fixed)', color: t === 'User-Facing' ? 'var(--on-primary-fixed-variant)' : 'var(--on-secondary-fixed-variant)' }}>{t}</span>
                        ))}
                        <Menu
                          items={featureMenuItems(i)}
                          label={`Actions for ${f.title}`}
                          className="create-menu-btn"
                          menuClassName="create-menu-dropdown"
                        />
                      </div>
                    </div>
                    {isEditing ? (
                      <textarea
                        className="input create-feature-desc"
                        rows={2}
                        value={f.description}
                        onChange={(e) => {
                          const updated = [...features];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setFeatures(updated);
                        }}
                      />
                    ) : (
                      <p className="body-md create-feature-desc-static">{f.description}</p>
                    )}
                    <div className="create-feature-meta">
                      <span className="create-meta-item">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>commit</span> {f.commits} commits
                      </span>
                      <span className="create-meta-item">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span> {f.author}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className={`create-section ${activeSection === 'bugs' ? 'active' : ''}`} onClick={() => setActiveSection('bugs')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <span className="create-section-badge" style={{ background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)' }}>B</span>
                  <h2 className="headline-sm">Bug Fixes</h2>
                  <span className="code-sm create-count-badge">{bugFixes.length} resolved</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); addBugFix(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  Add Fix
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {bugFixes.length === 0 && (
                  <p className="body-sm" style={{ color: 'var(--outline)', padding: 'var(--space-sm)' }}>
                    No bug fixes documented yet. Use "Add Fix" to record one.
                  </p>
                )}
                {bugFixes.map((b, i) => {
                  const isEditing = editingBug === i;
                  return (
                  <div key={`${b.bugId}-${i}`} className={`create-bug-item ${isEditing ? 'editing' : ''}`}>
                    <span className="material-symbols-outlined create-bug-icon">check_circle</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        {isEditing ? (
                          <>
                            <input
                              className="input create-bug-title-input"
                              value={b.title}
                              placeholder="Fix title"
                              onChange={(e) => updateBugFix(i, { title: e.target.value })}
                            />
                            <input
                              className="code-sm create-bug-id-input"
                              value={b.bugId}
                              aria-label="Bug ID"
                              onChange={(e) => updateBugFix(i, { bugId: e.target.value })}
                            />
                          </>
                        ) : (
                          <>
                            <span className="label-md">{b.title}</span>
                            <span className="code-sm create-bug-id">{b.bugId}</span>
                          </>
                        )}
                      </div>
                      {isEditing ? (
                        <>
                          <textarea
                            className="input create-bug-desc-input"
                            rows={2}
                            value={b.description}
                            placeholder="What was broken and how it was fixed"
                            onChange={(e) => updateBugFix(i, { description: e.target.value })}
                          />
                          <input
                            className="code-sm create-bug-commit-input"
                            value={b.commit}
                            aria-label="Commit"
                            onChange={(e) => updateBugFix(i, { commit: e.target.value })}
                          />
                        </>
                      ) : (
                        <p className="body-sm" style={{ color: 'var(--secondary)', marginTop: 2 }}>{b.description}</p>
                      )}
                    </div>
                    {!isEditing && <span className="code-sm" style={{ color: 'var(--outline)' }}>{b.commit}</span>}
                    <Menu
                      items={bugMenuItems(i)}
                      label={`Actions for ${b.title}`}
                      className="create-menu-btn"
                    />
                  </div>
                  );
                })}
              </div>
            </div>

            <div className={`create-section ${activeSection === 'behaviour' ? 'active' : ''}`} onClick={() => setActiveSection('behaviour')}>
              <div className="create-section-title" style={{ paddingBottom: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <span className="create-section-badge" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>C</span>
                <h2 className="headline-sm">Changed Behaviour</h2>
              </div>
              <div className="create-feature-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--primary)', marginBottom: 'var(--space-sm)' }} className="label-md">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync_alt</span>
                  <span>Contract Modification</span>
                </div>
                <textarea
                  className="input create-behaviour-input"
                  rows={2}
                  value={behaviourChange}
                  placeholder="Describe the contract or behaviour change"
                  onChange={(e) => setBehaviourChange(e.target.value)}
                />
                <p className="body-sm" style={{ color: 'var(--outline)', marginTop: 'var(--space-sm)' }}>Client token refresh cadence automatically recalibrated on auth gateway v2.</p>
              </div>
            </div>

            <div className={`create-section ${activeSection === 'qa' ? 'active' : ''}`} onClick={() => setActiveSection('qa')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <span className="create-section-badge" style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)' }}>D</span>
                  <h2 className="headline-sm">QA Summary & Evidence</h2>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); addEvidence(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
                  Add QA Evidence
                </button>
              </div>
              <div className="create-qa-metrics">
                {[
                  { key: 'testsExecuted', label: 'Tests Executed', color: 'var(--on-surface)', numeric: true },
                  { key: 'testsPassed', label: 'Tests Passed', color: 'var(--tertiary-container)', numeric: true },
                  { key: 'testsFailed', label: 'Tests Failed', color: 'var(--error)', numeric: true, derived: true },
                  { key: 'environment', label: 'Environment', color: 'var(--on-surface)', small: true },
                  { key: 'browsers', label: 'Browsers', color: 'var(--on-surface)', small: true },
                ].map((m) => (
                  <div key={m.label} className="create-qa-metric">
                    <span className="label-sm" style={{ color: 'var(--secondary)', textTransform: 'uppercase', display: 'block' }}>{m.label}</span>
                    {m.derived ? (
                      <span className="code-md" style={{ color: m.color, fontWeight: 600, display: 'block' }}>{testsFailed}</span>
                    ) : (
                      <input
                        className={m.small ? 'code-sm' : 'code-md'}
                        style={{ color: m.color, fontWeight: 600, width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', padding: '0 2px' }}
                        type={m.numeric ? 'number' : 'text'}
                        min={m.numeric ? 0 : undefined}
                        aria-label={m.label}
                        value={qaStats[m.key]}
                        onChange={(e) => setQaStats((prev) => ({
                          ...prev,
                          [m.key]: m.numeric ? Math.max(0, Number(e.target.value) || 0) : e.target.value,
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="create-qa-passrate">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }} className="label-sm">
                  <span style={{ color: 'var(--secondary)' }}>Pass Rate ({passRateLabel}%)</span>
                  <span className="code-sm" style={{ color: passRate >= 99 ? 'var(--tertiary-container)' : 'var(--error)' }}>
                    {passRate >= 99 ? 'Target Met: >99%' : 'Below target: >99%'}
                  </span>
                </div>
                <div className="progress-track" style={{ height: 8, display: 'flex' }}>
                  <div style={{ width: `${passRateWidth}%`, background: 'var(--tertiary-container)', height: 8, borderRadius: 'var(--radius-full)' }} />
                  <div style={{ width: `${100 - passRateWidth}%`, background: 'var(--error)', height: 8, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {evidence.length === 0 && (
                  <p className="body-sm" style={{ color: 'var(--outline)', padding: 'var(--space-sm)' }}>
                    No QA evidence attached yet. Use "Add QA Evidence" to attach an artifact.
                  </p>
                )}
                {evidence.map((e, i) => {
                  const isEditing = editingEvidence === i;
                  return (
                  <div key={i} className={`create-evidence-item ${isEditing ? 'editing' : ''}`}>
                    <span className="material-symbols-outlined create-evidence-icon">verified</span>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <>
                          <textarea
                            className="input create-evidence-text-input"
                            rows={2}
                            value={e.text}
                            placeholder="What was verified"
                            onChange={(ev) => updateEvidence(i, { text: ev.target.value })}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 4 }}>
                            <input
                              className="code-sm create-evidence-artifact-input"
                              value={e.artifact}
                              aria-label="Artifact"
                              onChange={(ev) => updateEvidence(i, { artifact: ev.target.value })}
                            />
                            <span style={{ color: 'var(--outline)', fontSize: 12 }}>-</span>
                            <input
                              className="label-sm create-evidence-verifier-input"
                              value={e.verifiedBy}
                              aria-label="Verified by"
                              onChange={(ev) => updateEvidence(i, { verifiedBy: ev.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="body-md">{e.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 4 }}>
                            <span className="code-sm" style={{ color: 'var(--outline)' }}>artifact: {e.artifact}</span>
                            <span style={{ color: 'var(--outline)', fontSize: 12 }}>-</span>
                            <span className="label-sm" style={{ color: 'var(--secondary)' }}>Verified by {e.verifiedBy}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Menu
                      items={evidenceMenuItems(i)}
                      label={`Actions for evidence ${i + 1}`}
                      className="create-menu-btn"
                    />
                  </div>
                  );
                })}
              </div>
            </div>

            <div className={`create-section ${activeSection === 'limitations' ? 'active' : ''}`} onClick={() => setActiveSection('limitations')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <span className="create-section-badge" style={{ background: '#fde68a', color: '#92400e' }}>E</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 20 }}>warning</span>
                  <h2 className="headline-sm" style={{ color: '#92400e' }}>Known Limitations</h2>
                </div>
              </div>
              <div className="create-limitations-card">
                <span className="material-symbols-outlined create-limitations-icon">info</span>
                <div style={{ flex: 1 }}>
                  {editingLimitation ? (
                    <textarea
                      className="input create-limitation-input"
                      rows={2}
                      value={limitation}
                      placeholder="Describe the limitation and its upstream cause"
                      onChange={(e) => setLimitation(e.target.value)}
                    />
                  ) : (
                    <p className="body-md" style={{ color: '#92400e' }}>{limitation}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                    <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#fde68a', color: '#92400e' }}>Upstream issue</span>
                    <span className="label-sm" style={{ color: '#b45309' }}>Patch expected in WebKit TP v186</span>
                    <button
                      type="button"
                      className="code-sm create-limitation-edit-btn"
                      onClick={(e) => { e.stopPropagation(); setEditingLimitation((v) => !v); }}
                    >
                      {editingLimitation ? 'Done' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`create-section ${activeSection === 'migration' ? 'active' : ''}`} onClick={() => setActiveSection('migration')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <span className="create-section-badge" style={{ background: 'var(--secondary-fixed)', color: 'var(--on-secondary-fixed)' }}>F</span>
                  <h2 className="headline-sm">Migration & Configuration Notes</h2>
                  <span className="code-sm create-count-badge">{migrationNotes.length} command{migrationNotes.length === 1 ? '' : 's'}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); addMigrationNote(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  Add Note
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {migrationNotes.length === 0 && (
                  <p className="body-sm" style={{ color: 'var(--outline)', padding: 'var(--space-sm)' }}>
                    No migration notes. Use "Add Note" to record a command.
                  </p>
                )}
                {migrationNotes.map((note, i) => (
                  <div key={i} className="create-migration-item">
                    <span className="label-md">{i === 0 ? 'Run database migration V24' : 'Set environment variable'}</span>
                    <div className="create-migration-code">
                      <input
                        className="code-sm create-migration-input"
                        value={note}
                        aria-label={`Migration note ${i + 1}`}
                        onChange={(e) => setMigrationNotes((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
                      />
                      <button className="create-copy-btn" onClick={() => handleCopyText(note)} title="Copy command">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                      </button>
                      <button className="create-copy-btn" onClick={() => removeMigrationNote(i)} title="Remove note">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`create-section ${activeSection === 'audiences' ? 'active' : ''}`} onClick={() => setActiveSection('audiences')}>
              <div className="create-section-header">
                <div className="create-section-title">
                  <span className="create-section-badge" style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>G</span>
                  <h2 className="headline-sm">Affected User Groups</h2>
                </div>
                <span className="code-sm" style={{ color: 'var(--secondary)' }}>{activeAudienceCount} of 5 active</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                {Object.entries(audiences).map(([group, active]) => (
                  <button key={group} className={`create-audience-pill ${active ? 'active' : ''}`} onClick={() => toggleAudience(group)}>
                    {active && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                    {group}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4', position: 'sticky', top: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <div className="create-completeness">
              <div className="create-completeness-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>fact_check</span>
                  <h3 className="headline-sm">Release Completeness</h3>
                </div>
                <span className="code-sm create-ready-badge" style={{ opacity: completeness === 100 ? 1 : 0.7 }}>
                  {completeness === 100 ? '100% READY' : `${completeness}% COMPLETE`}
                </span>
              </div>
              <div className="create-completeness-body">
                <ProgressRing
                  value={completeness}
                  size={56}
                  color={completeness === 100 ? 'var(--tertiary-container)' : 'var(--error)'}
                  label={`${completedSections}/${sections.length}`}
                />
                <div>
                  <div className="headline-sm">{completeness === 100 ? 'All Sections Valid' : 'Sections Incomplete'}</div>
                  <p className="body-sm" style={{ color: 'var(--secondary)' }}>
                    {completedSections} / {sections.length} sections complete ({completeness}%)
                  </p>
                </div>
              </div>
              <div className="create-checklist">
                {sections.map((s) => {
                  const done = sectionComplete[s.key];
                  return (
                  <div key={s.key} className={`create-checklist-item ${done ? '' : 'incomplete'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: done ? 'var(--tertiary-container)' : 'var(--outline)', fontSize: 18 }}>
                        {done ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{s.label}</span>
                    </div>
                    <span className="code-sm" style={{ color: 'var(--outline)' }}>{s.count(checklistContext)}</span>
                  </div>
                  );
                })}
              </div>
              <div className="create-completeness-tip">
                <span className="material-symbols-outlined" style={{ color: completeness === 100 ? 'var(--tertiary-container)' : 'var(--outline)', fontSize: 20, flexShrink: 0 }}>
                  {completeness === 100 ? 'auto_awesome' : 'info'}
                </span>
                <p className="body-sm">
                  {completeness === 100
                    ? 'All required sections populated. Ready for automated AI readiness analysis.'
                    : `${sections.length - completedSections} section(s) still need entries before analysis.`}
                </p>
              </div>
              <div className="create-completeness-actions">
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={() => handleSubmit('analyze')} disabled={submitting}>
                  {submitting ? 'Analyzing...' : 'Analyze Release'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
                <button className="btn btn-secondary btn-lg" style={{ width: '100%', justifyContent: 'center', height: 40 }} onClick={() => handleSubmit('draft')} disabled={submitting}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                  Save Draft
                </button>
              </div>
            </div>

            <div className="card create-ai-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18 }}>neurology</span>
                <span className="label-md">AI Inspector Heuristics</span>
              </div>
              <p className="body-sm" style={{ color: 'var(--secondary)', lineHeight: '1.5rem' }}>
                The analyzer will cross-reference PR #1402 & PR #1419 with git commit trees, run synthetic changelog drafts, and generate an executive risk score.
              </p>
              <div className="create-ai-footer">
                <span>Model: Pilot-DeepSync v4</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tertiary-container)' }}>
                  <span className="create-status-dot" /> Ready
                </span>
              </div>
            </div>
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
        onStart={() => handleSubmit('analyze')}
        onViewAnalysis={() => {
          setAiModalOpen(false);
          const releasePayload = {
            ...form,
            status: 'Analyzing',
            author: 'Alex Rivera',
            packageData: {
              features,
              bugFixes,
              behaviourChanges: [behaviourChange],
              qaSummary: {
                testsExecuted: qaStats.testsExecuted,
                testsPassed: qaStats.testsPassed,
                testsFailed,
                environment: qaStats.environment,
                browsers: qaStats.browsers,
                passRate: Number(passRateLabel),
                evidence,
              },
              knownLimitations: [limitation],
              migrationNotes,
              affectedGroups: Object.keys(audiences).filter((k) => audiences[k]),
              completeness,
            },
          };
          navigateToAnalysis(aiResult, releasePayload);
        }}
        onRetry={() => handleSubmit('analyze')}
      />
    </div>
  );
}
