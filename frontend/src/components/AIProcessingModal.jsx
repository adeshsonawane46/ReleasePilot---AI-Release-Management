import { useMemo } from 'react';
import Modal from './Modal.jsx';

const DEFAULT_STEPS = [
  { id: 'validatePackage', label: 'Validating release package' },
  { id: 'classifyImpact', label: 'Classifying user impact' },
  { id: 'checkMissingInfo', label: 'Checking missing information' },
  { id: 'verifyQaEvidence', label: 'Verifying QA evidence' },
  { id: 'detectClaims', label: 'Detecting unsupported claims' },
  { id: 'identifyRisks', label: 'Identifying risks' },
  { id: 'generateBriefs', label: 'Generating release briefs' },
];

/**
 * AIProcessingModal
 * 
 * Statuses:
 *  - 'idle': Ready for AI analysis
 *  - 'analyzing': AI is analyzing your release...
 *  - 'completed': AI analysis completed
 *  - 'failed': AI analysis failed
 */
export default function AIProcessingModal({
  open,
  onClose,
  status = 'idle',
  currentStep = '',
  completedSteps = [],
  error = null,
  result = null,
  onStart,
  onViewAnalysis,
  onRetry,
}) {
  const steps = DEFAULT_STEPS;

  const findingsCount = useMemo(() => {
    if (!result) return 0;
    const impacts = result.impacts?.length || 0;
    const missing = result.missingInfo?.length || 0;
    return impacts + missing;
  }, [result]);

  const risksCount = useMemo(() => {
    if (!result) return 0;
    return result.risks?.length || result.flaggedRisks || 0;
  }, [result]);

  const claimsCount = useMemo(() => {
    if (!result) return 0;
    return result.unsupportedClaims?.length || 0;
  }, [result]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={status === 'analyzing' ? () => {} : onClose}
      title={
        status === 'analyzing'
          ? '✨ AI Release Analysis'
          : status === 'completed'
          ? '✓ AI Analysis Complete'
          : status === 'failed'
          ? '⚠️ AI Analysis Failed'
          : '✨ AI Release Analysis'
      }
      icon={status === 'analyzing' ? 'auto_awesome' : status === 'completed' ? 'task_alt' : status === 'failed' ? 'error' : 'neurology'}
      maxWidth={540}
      footer={
        <div className="action-row" style={{ justifyContent: 'flex-end', width: '100%' }}>
          {status === 'idle' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onStart}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                Analyze Release
              </button>
            </>
          )}

          {status === 'analyzing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--secondary)' }} className="label-sm">
              <span className="loading-spinner" style={{ width: 14, height: 14, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              AI is analyzing your release...
            </div>
          )}

          {status === 'completed' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={onViewAnalysis}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                View Analysis
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onRetry || onStart}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                Retry Analysis
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="ai-processing-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {status === 'idle' && (
          <div className="ai-status-idle" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: 'var(--space-md) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="badge badge-info" style={{ fontWeight: 600 }}>Ready for AI Analysis</span>
            </div>
            <h3 className="headline-sm" style={{ marginTop: 4 }}>Ready to analyze release</h3>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Click <strong>Analyze Release</strong> to start the LangGraph workflow. The AI auditor will extract claims, verify QA evidence, classify user impact, and detect risks.
            </p>
          </div>
        )}

        {(status === 'analyzing' || status === 'completed') && (
          <div className="ai-processing-card" style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
                <span className={`ai-pulse-badge ${status === 'analyzing' ? 'pulsing' : ''}`} style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'completed' ? 'var(--tertiary-container)' : 'var(--primary)' }} />
                <span className="label-md" style={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--on-surface)' }}>
                  {status === 'completed' ? 'AI Analysis Complete' : 'LangGraph Execution'}
                </span>
              </div>
              <span className="code-sm" style={{ color: 'var(--secondary)' }}>
                {status === 'completed' ? '7 / 7 steps completed' : `${completedSteps.length} / 7 steps completed`}
              </span>
            </div>

            <div className="ai-step-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {steps.map((step) => {
                const isDone = status === 'completed' || completedSteps.includes(step.id);
                const isCurrent = status === 'analyzing' && !isDone && (currentStep === step.id || (!currentStep && completedSteps.length === 0 && step.id === steps[0].id));

                return (
                  <div
                    key={step.id}
                    className={`ai-step-row ${isDone ? 'is-done' : isCurrent ? 'is-current' : 'is-pending'}`}
style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      gap: 'var(--space-xs)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--surface-container-low)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
                      {isDone ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10B981', fontWeight: 'bold' }}>
                          check
                        </span>
                      ) : isCurrent ? (
                        <span className="ai-current-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 8px var(--primary)' }} />
                      ) : (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--outline)', display: 'inline-block' }} />
                      )}
                      <span
                        className="body-sm"
                        style={{
                          fontWeight: isCurrent ? 600 : 400,
                          color: isDone ? 'var(--on-surface)' : isCurrent ? 'var(--primary)' : 'var(--outline)',
                        }}
                      >
                        {step.label}...
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isDone && (
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10B981' }}>
                          check_circle
                        </span>
                      )}
                      {isCurrent && (
                        <span className="material-symbols-outlined loading-spinner" style={{ fontSize: 16, color: 'var(--primary)' }}>
                          sync
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--outline-variant)', textAlign: 'center' }}>
              <span className="body-sm" style={{ color: 'var(--secondary)', fontStyle: status === 'analyzing' ? 'italic' : 'normal' }}>
                {status === 'analyzing' ? 'AI is analyzing your release...' : 'AI analysis completed successfully.'}
              </span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="ai-completed-summary" style={{ background: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--tertiary-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: 20 }}>verified</span>
              <span className="label-md" style={{ fontWeight: 600 }}>Summary Findings</span>
            </div>
            <div className="metric-grid" style={{ marginTop: 'var(--space-xs)' }}>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span className="headline-sm" style={{ color: 'var(--primary)' }}>{findingsCount}</span>
                <p className="body-sm" style={{ color: 'var(--secondary)' }}>Findings</p>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span className="headline-sm" style={{ color: 'var(--error)' }}>{risksCount}</span>
                <p className="body-sm" style={{ color: 'var(--secondary)' }}>Risks</p>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span className="headline-sm" style={{ color: 'var(--secondary)' }}>{claimsCount}</span>
                <p className="body-sm" style={{ color: 'var(--secondary)' }}>Unsupported Claims</p>
              </div>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="ai-failed-card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)', border: '1px solid var(--error)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 24, flexShrink: 0 }}>error</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h4 className="headline-sm" style={{ color: 'var(--error)' }}>AI Analysis Failed</h4>
                <p className="body-md" style={{ color: 'var(--on-surface)' }}>
                  {error || 'Unable to complete AI analysis. Please check your AI configuration and try again.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
