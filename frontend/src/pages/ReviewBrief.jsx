import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import '../css/review.css';

const fallbackStatements = [
  {
    _id: '1',
    stmtId: 'STMT-094-EXPORT',
    text: 'PDF export is available to all users on Chrome and Firefox.',
    originalText: 'PDF export is available to all users.',
    status: 'Needs Review',
    severity: 'Medium',
    confidence: 'High (94%)',
    evidence: ['Feature #1: PR #402', 'QA Evidence #3'],
    justification: '',
    accent: 'var(--primary-container)',
  },
  {
    _id: '2',
    stmtId: 'STMT-095-CROSSBROWSER',
    text: 'PDF export works seamlessly across all web browsers without restriction.',
    originalText: 'PDF export works on all browsers.',
    status: 'Unsupported Claim',
    severity: 'Blocker',
    confidence: 'Low (42%)',
    evidence: ['Feature #1', 'QA Evidence #3', 'Issue #849 Safari Webkit'],
    justification: '',
    accent: 'var(--danger)',
    alert: 'Evidence only confirms Chrome v118. Safari WebKit canvas issue #849 is open and Firefox runs were incomplete.',
  },
  {
    _id: '3',
    stmtId: 'STMT-096-TIMEOUT',
    text: 'Session timeout changed from 30 minutes to 60 minutes.',
    originalText: 'Session timeout changed from 30 minutes to 60 minutes.',
    status: 'Approved',
    severity: 'Low',
    confidence: 'High (98%)',
    reviewedBy: 'Alex Rivera (10:43 AM)',
    evidence: ['Change #1: config/auth.json'],
    justification: 'Verified against auth service configuration commit.',
    accent: 'var(--success)',
  },
  {
    _id: '4',
    stmtId: 'STMT-097-DARKMODE',
    text: 'Dark Mode toggle is now available across standard dashboard navigation.',
    originalText: 'Full dark mode redesign implemented everywhere.',
    status: 'Edited',
    severity: 'Medium',
    confidence: 'Medium (81%)',
    evidence: ['Feature #2: UI System overhaul'],
    justification: 'Clarified scope to standard dashboard navigation only.',
    accent: 'var(--primary-container)',
  },
  {
    _id: '5',
    stmtId: 'STMT-098-LATENCY',
    text: 'Database query latency reduced by 35% on dashboard aggregate views.',
    originalText: 'Database query latency reduced by 35%.',
    status: 'Needs Review',
    severity: 'High',
    confidence: 'High (91%)',
    evidence: ['PR #418 - Index optimization', 'Benchmark #12'],
    justification: '',
    accent: 'var(--warning)',
  },
];

export default function ReviewBrief() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [statements, setStatements] = useState(fallbackStatements);
  const [selectedId, setSelectedId] = useState('1');
  const [editText, setEditText] = useState('');
  const [justification, setJustification] = useState('');

  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [newEvidenceText, setNewEvidenceText] = useState('');

  // Fetch statements from API if available
  useEffect(() => {
    let isMounted = true;
    api.getStatements('v2.4.0')
      .then((data) => {
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setStatements(data);
          if (data[0]?._id) setSelectedId(data[0]._id);
        }
      })
      .catch(() => {
        // use fallbacks silently
      });
    return () => { isMounted = false; };
  }, []);

  const selected = statements.find((s) => s._id === selectedId) || statements[0];

  // Keep edit form in sync with selected statement
  useEffect(() => {
    if (selected) {
      setEditText(selected.text ? selected.text.replace(/^"(.*)"$/, '$1') : '');
      setJustification(selected.justification || '');
    }
  }, [selectedId, statements]);

  // Action handlers
  const handleAction = async (id, action) => {
    const target = statements.find((s) => s._id === id);
    if (!target) return;

    let newStatus = target.status;
    let newReviewedBy = target.reviewedBy;
    let newAccent = target.accent;

    if (action === 'approve') {
      newStatus = 'Approved';
      newReviewedBy = 'Alex Rivera';
      newAccent = 'var(--success)';
    } else if (action === 'reject') {
      newStatus = 'Rejected';
      newReviewedBy = 'Alex Rivera';
      newAccent = 'var(--danger)';
    } else if (action === 'reopen') {
      newStatus = 'Needs Review';
      newReviewedBy = null;
      newAccent = 'var(--warning)';
    }

    setStatements((prev) =>
      prev.map((s) => (s._id === id ? { ...s, status: newStatus, reviewedBy: newReviewedBy, accent: newAccent } : s))
    );

    try {
      await api.updateStatement(id, { status: newStatus, reviewedBy: newReviewedBy });
    } catch {}

    const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 're-opened for review';
    showToast(`Statement ${target.stmtId || ''} ${actionText}`);
  };

  const handleSave = async () => {
    if (!selected) return;

    const updatedText = editText.trim();
    const updatedJust = justification.trim();

    setStatements((prev) =>
      prev.map((s) =>
        s._id === selectedId
          ? {
              ...s,
              text: updatedText,
              justification: updatedJust,
              status: 'Edited',
              originalText: s.originalText || s.text,
              accent: 'var(--primary-container)',
            }
          : s
      )
    );

    try {
      await api.updateStatement(selectedId, { text: updatedText, justification: updatedJust, status: 'Edited' });
    } catch {}

    showToast(`Statement ${selected.stmtId} changes saved`);
  };

  const handleCancel = () => {
    if (selected) {
      setEditText(selected.text ? selected.text.replace(/^"(.*)"$/, '$1') : '');
      setJustification(selected.justification || '');
    }
    showToast('Edit changes discarded');
  };

  const handleAddEvidence = () => {
    if (!newEvidenceText.trim() || !selected) return;
    const tag = newEvidenceText.trim();
    setStatements((prev) =>
      prev.map((s) => (s._id === selectedId ? { ...s, evidence: [...(s.evidence || []), tag] } : s))
    );
    setNewEvidenceText('');
    setIsAddingEvidence(false);
    showToast(`Evidence [${tag}] attached`);
  };

  const handleRemoveEvidence = (indexToRemove) => {
    if (!selected) return;
    setStatements((prev) =>
      prev.map((s) =>
        s._id === selectedId
          ? { ...s, evidence: (s.evidence || []).filter((_, idx) => idx !== indexToRemove) }
          : s
      )
    );
    showToast('Evidence tag removed');
  };

  const handleFinalize = () => {
    const pending = statements.filter((s) => s.status === 'Needs Review' || s.status === 'Unsupported Claim').length;
    if (pending > 0) {
      showToast(`Cannot finalize: ${pending} statement(s) still require review decision.`);
      return;
    }
    showToast('Release brief v2.4.0 finalized and signed off by Alex Rivera!');
    navigate('/final-brief');
  };

  // Filter logic
  const filteredStatements = statements.filter((s) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Needs Review') return s.status === 'Needs Review';
    if (filterStatus === 'Approved') return s.status === 'Approved';
    if (filterStatus === 'Edited') return s.status === 'Edited';
    if (filterStatus === 'Flagged / Unsupported') return s.status === 'Unsupported Claim' || s.status === 'Rejected';
    if (filterStatus === 'Rejected') return s.status === 'Rejected';
    return true;
  });

  // Sort logic
  const severityRank = { Blocker: 4, High: 3, Medium: 2, Low: 1 };
  const sortedStatements = [...filteredStatements].sort((a, b) => {
    if (sortBy === 'severity') {
      return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    }
    if (sortBy === 'status') {
      const statusRank = { 'Needs Review': 5, 'Unsupported Claim': 4, Edited: 3, Approved: 2, Rejected: 1 };
      return (statusRank[b.status] || 0) - (statusRank[a.status] || 0);
    }
    return 0;
  });

  // Dynamic statistics
  const totalCount = statements.length;
  const approvedCount = statements.filter((s) => s.status === 'Approved').length;
  const editedCount = statements.filter((s) => s.status === 'Edited').length;
  const rejectedCount = statements.filter((s) => s.status === 'Rejected' || s.status === 'Unsupported Claim').length;
  const reviewedCount = statements.filter((s) => s.status === 'Approved' || s.status === 'Edited' || s.status === 'Rejected').length;
  const pendingCount = statements.filter((s) => s.status === 'Needs Review' || s.status === 'Unsupported Claim').length;
  const progressPercent = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  const statsList = [
    {
      label: 'Total Statements',
      value: totalCount,
      sub: 'extracted from diffs',
      icon: 'format_list_numbered',
      barColor: 'var(--secondary)',
      barWidth: '100%',
    },
    {
      label: 'Approved',
      value: approvedCount,
      sub: `${totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%`,
      dotColor: 'var(--success)',
      barColor: 'var(--success)',
      barWidth: `${totalCount > 0 ? (approvedCount / totalCount) * 100 : 0}%`,
    },
    {
      label: 'Edited by Reviewer',
      value: editedCount,
      sub: `${totalCount > 0 ? Math.round((editedCount / totalCount) * 100) : 0}%`,
      dotColor: 'var(--primary-container)',
      barColor: 'var(--primary-container)',
      barWidth: `${totalCount > 0 ? (editedCount / totalCount) * 100 : 0}%`,
    },
    {
      label: 'Rejected / Flagged',
      value: rejectedCount,
      sub: `${totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0}%`,
      dotColor: 'var(--danger)',
      barColor: 'var(--danger)',
      barWidth: `${totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0}%`,
    },
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Top Banner */}
      <div style={{ padding: 'var(--space-lg) var(--gutter-lg) 0' }}>
        <div className="review-banner">
          <div className="review-banner-content">
            <div className="review-banner-left">
              <div className="review-banner-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified_user</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span className="code-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600, color: '#92400e' }}>Human Review Required</span>
                  <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(254, 243, 199, 0.6)', color: '#92400e' }}>Enforcement Gate #4</span>
                </div>
                <p className="body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: 768 }}>
                  The AI engine cannot automatically approve or publish this release. Every customer-facing statement, claim, and migration impact must be verified and signed off by an authorized engineering reviewer.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexShrink: 0, paddingLeft: 56 }}>
              <div className="code-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-container-lowest)', padding: 'var(--space-md) var(--space-sm)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', color: 'var(--on-surface-variant)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary-fixed-dim)' }} />
                <span>Policy: Strict Audited RFC-82</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: 'var(--space-xl) var(--gutter-lg) var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="breadcrumb">
            <span>Releases</span>
            <span>/</span>
            <span style={{ color: 'var(--primary-container)', fontWeight: 600 }}>v2.4.0</span>
            <span>/</span>
            <span style={{ color: 'var(--on-surface)' }}>Review Queue</span>
          </div>
          <h1 className="headline-xl" style={{ letterSpacing: '-0.025em', marginTop: 4 }}>Review Release Brief</h1>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Review AI-generated statements before creating the final release brief.</p>
        </div>
        <div className="review-reviewer-card">
          <div className="review-reviewer-avatar">AR</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)' }}>Signing Reviewer</span>
            <span className="body-sm" style={{ fontWeight: 600 }}>Alex Rivera (Lead Eng)</span>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)', marginLeft: 'var(--space-sm)' }}>gpp_good</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ padding: '0 var(--gutter-lg)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gutter-lg)', marginTop: 'var(--space-md)' }}>
        {statsList.map((s) => (
          <div key={s.label} className="review-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{s.label}</span>
              {s.icon && <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 20 }}>{s.icon}</span>}
              {s.dotColor && <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.dotColor }} />}
            </div>
            <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
              <span className="headline-xl" style={{ fontWeight: 600, letterSpacing: '-0.025em', color: s.label.includes('Rejected') ? 'var(--danger)' : 'var(--on-surface)' }}>{s.value}</span>
              <span className="code-sm" style={{ color: s.label.includes('Approved') ? 'var(--success)' : s.label.includes('Edited') ? 'var(--primary-container)' : s.label.includes('Rejected') ? 'var(--danger)' : 'var(--on-surface-variant)', background: s.label.includes('Approved') ? 'var(--success-bg)' : s.label.includes('Edited') ? 'var(--surface-container)' : s.label.includes('Rejected') ? 'var(--danger-bg)' : 'transparent', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>{s.sub}</span>
            </div>
            <div className="progress-track" style={{ marginTop: 'var(--space-sm)', height: 6 }}>
              <div className="progress-fill" style={{ width: s.barWidth, background: s.barColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div style={{ padding: 'var(--space-xl) var(--gutter-lg) 0', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--gutter-lg)' }}>
        
        {/* Left Column: Queue Items */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          {/* Queue Header & Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-xs)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="headline-sm">Queue Items</span>
              <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                {sortedStatements.length} of {totalCount} items
              </span>
              {filterStatus !== 'All' && (
                <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-container)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Filter: {filterStatus}
                  <span className="material-symbols-outlined" style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => setFilterStatus('All')}>close</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', position: 'relative' }}>
              
              {/* Filter Button & Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`btn btn-sm ${filterStatus !== 'All' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowSortDropdown(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
                  Filter {filterStatus !== 'All' ? `(${filterStatus})` : ''}
                </button>

                {showFilterDropdown && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 40, width: 210, background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--outline-variant)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="label-sm" style={{ padding: '4px 8px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Filter by status</span>
                    {['All', 'Needs Review', 'Approved', 'Edited', 'Flagged / Unsupported', 'Rejected'].map((statusOption) => (
                      <button
                        key={statusOption}
                        className="body-sm"
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: filterStatus === statusOption ? 'var(--surface-container)' : 'transparent',
                          color: filterStatus === statusOption ? 'var(--primary-container)' : 'var(--on-surface)',
                          fontWeight: filterStatus === statusOption ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                        }}
                        onClick={() => {
                          setFilterStatus(statusOption);
                          setShowFilterDropdown(false);
                          showToast(`Filter set to: ${statusOption}`);
                        }}
                      >
                        <span>{statusOption}</span>
                        {filterStatus === statusOption && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Button & Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`btn btn-sm ${sortBy !== 'default' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowFilterDropdown(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_vert</span>
                  Sort {sortBy !== 'default' ? `(${sortBy})` : ''}
                </button>

                {showSortDropdown && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 40, width: 200, background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--outline-variant)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="label-sm" style={{ padding: '4px 8px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Sort options</span>
                    {[
                      { id: 'default', label: 'Default Sequence' },
                      { id: 'severity', label: 'Severity (Blocker First)' },
                      { id: 'status', label: 'Status (Pending First)' },
                    ].map((sortOption) => (
                      <button
                        key={sortOption.id}
                        className="body-sm"
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: sortBy === sortOption.id ? 'var(--surface-container)' : 'transparent',
                          color: sortBy === sortOption.id ? 'var(--primary-container)' : 'var(--on-surface)',
                          fontWeight: sortBy === sortOption.id ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                        }}
                        onClick={() => {
                          setSortBy(sortOption.id);
                          setShowSortDropdown(false);
                          showToast(`Sorted by ${sortOption.label}`);
                        }}
                      >
                        <span>{sortOption.label}</span>
                        {sortBy === sortOption.id && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Statement Cards List */}
          {sortedStatements.length === 0 ? (
            <div style={{ padding: 'var(--space-2xl)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--outline)' }}>search_off</span>
              <p className="body-md" style={{ marginTop: 8 }}>No statements match the selected filter criteria.</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setFilterStatus('All')}>
                Reset Filter
              </button>
            </div>
          ) : (
            sortedStatements.map((s) => (
              <div
                key={s._id}
                className={`review-statement-card ${selectedId === s._id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedId(s._id);
                  document.querySelector('.review-edit-panel')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ cursor: 'pointer', opacity: s.status === 'Approved' ? 0.9 : 1 }}
              >
                <div className="review-statement-accent" style={{ background: s.accent }} />
                
                {/* Header row of statement card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <span className={`badge ${s.status === 'Approved' ? 'badge-success' : s.status === 'Edited' ? 'badge-info' : (s.status === 'Unsupported Claim' || s.status === 'Rejected') ? 'badge-danger' : 'badge-warning'}`}>
                      <span className="dot" />
                      {s.status}
                    </span>

                    {s.confidence && (
                      <span className="code-sm" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--tertiary)' }}>psychology</span>
                        Confidence: <strong style={{ color: 'var(--on-surface)' }}>{s.confidence}</strong>
                      </span>
                    )}

                    {s.severity && (
                      <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: s.severity === 'Blocker' ? '#ffe4e6' : s.severity === 'High' ? '#ffedd5' : 'var(--surface-container-high)', color: s.severity === 'Blocker' ? '#9f1239' : s.severity === 'High' ? '#c2410c' : 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Severity: {s.severity}
                      </span>
                    )}
                  </div>

                  {selectedId === s._id && (
                    <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container)', color: 'var(--primary-container)', fontWeight: 600 }}>
                      Active Selection
                    </span>
                  )}
                </div>

                {/* Main statement text */}
                <div className="review-statement-text" style={{ background: s.status === 'Approved' ? 'rgba(242, 243, 255, 0.4)' : (s.status === 'Unsupported Claim' || s.status === 'Rejected') ? 'rgba(254, 242, 242, 0.5)' : 'rgba(242, 243, 255, 0.7)' }}>
                  "{s.text}"
                </div>

                {/* Alert box if any */}
                {s.alert && (
                  <div style={{ padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-lg)', background: '#fff1f2', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: 20, flexShrink: 0, marginTop: 2 }}>error</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="label-sm" style={{ fontWeight: 600, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Automated Discrepancy Found</span>
                      <p className="body-sm" style={{ color: '#9f1239' }}>{s.alert}</p>
                    </div>
                  </div>
                )}

                {/* Original AI text if edited */}
                {s.originalText && s.originalText !== s.text && (
                  <div style={{ padding: 'var(--space-sm) var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'rgba(226, 231, 255, 0.4)', display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--on-surface-variant)' }}>
                    <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--secondary)' }}>Original AI generation:</span>
                    <p className="body-sm" style={{ textDecoration: 'line-through', color: 'var(--outline)' }}>"{s.originalText}"</p>
                  </div>
                )}

                {/* Evidence tags */}
                <div className="review-evidence-tags">
                  <span className="label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--on-surface-variant)' }}>Evidence:</span>
                  {s.evidence?.map((e, idx) => (
                    <span key={idx} className="citation-tag" style={e.includes('Issue') || e.includes('Safari') ? { background: '#ffe4e6', color: '#9f1239' } : {}}>
                      {e.includes('PR') && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>commit</span>}
                      {e.includes('QA') && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fact_check</span>}
                      [{e}]
                    </span>
                  ))}
                </div>

                {/* Action buttons row */}
                <div style={{ paddingTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {(s.status === 'Needs Review' || s.status === 'Edited') && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(s._id);
                            document.querySelector('.review-edit-panel')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--success)', color: '#fff' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(s._id, 'approve');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                          Approve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--surface-container-lowest)', color: 'var(--danger)', border: '1px solid var(--outline-variant)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(s._id, 'reject');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                          Reject
                        </button>
                      </>
                    )}

                    {s.status === 'Unsupported Claim' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(s._id);
                            document.querySelector('.review-edit-panel')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit_note</span>
                          Edit Statement
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--danger)', color: '#fff' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(s._id, 'reject');
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
                          Reject Claim
                        </button>
                      </>
                    )}

                    {(s.status === 'Approved' || s.status === 'Rejected') && (
                      <button
                        className="code-sm"
                        style={{ color: 'var(--primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(s._id, 'reopen');
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>restart_alt</span>
                        Re-open Decision
                      </button>
                    )}
                  </div>
                  <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>ID: {s.stmtId}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Edit Panel */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column' }}>
          <div className="review-edit-panel">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--primary-container)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rate_review</span>
                  </div>
                  <h2 className="headline-sm" style={{ fontWeight: 600 }}>Edit Statement</h2>
                </div>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>Modify AI-generated statement and commit reviewer override.</p>
              </div>
              <span className="code-sm" style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-container)', fontWeight: 600 }}>
                {selected?.stmtId || 'STMT'}
              </span>
            </div>

            {/* Statement Text input */}
            <div className="review-edit-field">
              <label className="review-edit-label">
                <span>Statement Text</span>
                <span className="code-sm" style={{ color: 'var(--primary-container)', textTransform: 'lowercase', fontWeight: 'normal' }}>
                  {editText.length} characters
                </span>
              </label>
              <textarea
                className="input"
                rows={4}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{ resize: 'none', lineHeight: '1.5rem', fontFamily: 'var(--font-sans)', padding: 'var(--space-md)' }}
              />
              <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Keep phrasing direct and aligned with actual engineering evidence.</span>
            </div>

            {/* Evidence items & Add button */}
            <div className="review-edit-field">
              <label className="review-edit-label"><span>Supporting Evidence Tags</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {selected?.evidence?.map((e, index) => (
                  <div key={index} className="review-evidence-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', overflow: 'hidden' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 16 }}>task_alt</span>
                      <span className="code-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>[{e}]</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEvidence(index)}
                      title="Remove evidence tag"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', padding: 2 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                ))}
                
                {isAddingEvidence ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 4 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. PR #405 or QA Evidence #4"
                      value={newEvidenceText}
                      onChange={(e) => setNewEvidenceText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddEvidence(); }}
                      style={{ height: 36, fontSize: '0.875rem' }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAddEvidence}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsAddingEvidence(false)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className="code-sm"
                    onClick={() => setIsAddingEvidence(true)}
                    style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4, fontWeight: 600 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
                    Attach additional PR or benchmark
                  </button>
                )}
              </div>
            </div>

            {/* Justification note */}
            <div className="review-edit-field">
              <label className="review-edit-label"><span>Reviewer Justification Note</span></label>
              <input
                className="input"
                style={{ height: 40 }}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain reviewer reasoning for override..."
              />
              <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>This justification will be logged permanently in the immutable audit trail.</span>
            </div>

            {/* Semantic Match Widget */}
            <div className="review-match-widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="label-sm">
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>Semantic Match Analysis</span>
                <span className="code-sm" style={{ color: '#15803d', fontWeight: 600 }}>Passes Policy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <svg width={48} height={48} viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-container-high)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--primary-container)" strokeWidth="3.5" strokeDasharray="88, 100" strokeLinecap="round" transform="rotate(-90 18 18)" />
                  <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" fontFamily="var(--font-mono)">88%</text>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="body-sm" style={{ fontWeight: 600 }}>Precision Alignment High</span>
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Zero hallucinated telemetry parameters found.</span>
                </div>
              </div>
            </div>

            {/* Save / Cancel action buttons */}
            <div style={{ paddingTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
              <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                Save Changes
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Footer & Progress */}
      <div className="review-sticky-footer">
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280, flex: 1, maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="body-sm" style={{ fontWeight: 600 }}>Review Progress:</span>
                <span className="code-sm" style={{ fontWeight: 600, color: 'var(--primary-container)' }}>
                  {reviewedCount} / {totalCount} statements reviewed ({progressPercent}%)
                </span>
              </div>
              <span className="code-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {pendingCount === 0 ? 'All items decided!' : `${pendingCount} remaining`}
              </span>
            </div>

            <div className="review-progress-bar">
              {statements.map((s, i) => {
                let bg = 'var(--surface-container-high)';
                if (s.status === 'Approved') bg = 'var(--success)';
                else if (s.status === 'Edited') bg = 'var(--primary-container)';
                else if (s.status === 'Rejected') bg = 'var(--danger)';
                else if (s.status === 'Unsupported Claim') bg = 'var(--warning)';
                return <div key={i} className="review-progress-segment" style={{ background: bg, flex: 1 }} title={`${s.stmtId}: ${s.status}`} />;
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>
                {pendingCount === 0 ? 'lock_open' : 'lock'}
              </span>
              <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {pendingCount === 0 ? 'Review complete. Ready to finalize brief.' : 'Finalization unlocked once all statements have been decided.'}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                className={`btn btn-lg ${pendingCount === 0 ? 'btn-primary' : ''}`}
                style={pendingCount > 0 ? { background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', cursor: 'not-allowed', opacity: 0.8 } : { cursor: 'pointer' }}
                disabled={pendingCount > 0}
                onClick={handleFinalize}
              >
                Finalize Release Brief
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>

              {pendingCount > 0 && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24' }}>warning</span>
                  <span>{pendingCount} pending decision{pendingCount > 1 ? 's' : ''} remaining</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
