import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  CheckCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  GitBranch,
  RefreshCw,
  Edit3,
  Send,
  MessageSquare,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { draftsApi, verificationApi, approvalsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FindingCard from '../components/FindingCard';
import { SeverityBadge } from '../components/FindingBadge';

export default function DraftDetailsPage() {
  const { draftId } = useParams();
  const { user } = useAuth();

  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);

  // Revision Editor State
  const [isRevising, setIsRevising] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);

  // Reviewer Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('approved'); // 'approved' | 'changes_requested'
  const [decisionComment, setDecisionComment] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const fetchDraftData = async () => {
    setLoading(true);
    try {
      const [draftRes, findingsRes, histRes] = await Promise.all([
        draftsApi.getDraft(draftId),
        verificationApi.getFindings(draftId),
        draftsApi.getDraftHistory(draftId)
      ]);
      setDraft(draftRes.data);
      setFindings(findingsRes.data);
      setHistory(histRes.data);
      setRevisionText(draftRes.data.latest_content_text || '');
    } catch (err) {
      console.error('Error fetching draft details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftData();
  }, [draftId]);

  const handleReverify = async () => {
    setReverifying(true);
    try {
      await verificationApi.verifyDraft(draftId);
      await fetchDraftData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Re-verification failed.');
    } finally {
      setReverifying(false);
    }
  };

  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    if (!revisionText.trim()) return;
    setSubmittingRev(true);
    try {
      await draftsApi.submitRevision(draftId, {
        content_text: revisionText,
        submission_type: 'text'
      });
      await verificationApi.verifyDraft(draftId);
      setIsRevising(false);
      await fetchDraftData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit revision.');
    } finally {
      setSubmittingRev(false);
    }
  };

  const handleApplySuggestion = (orig, suggested) => {
    if (!isRevising) {
      setIsRevising(true);
    }
    setRevisionText((prev) => {
      if (prev.includes(orig)) {
        return prev.replace(orig, suggested);
      }
      return prev + `\n${suggested}`;
    });
  };

  const handleOpenDecision = (type) => {
    setDecisionType(type);
    setDecisionComment('');
    setOverrideReason('');
    setDecisionError('');
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    setDecisionError('');
    setSubmittingDecision(true);
    try {
      await approvalsApi.submitDecision(draftId, {
        decision: decisionType,
        comment: decisionComment,
        override_reason: overrideReason || undefined
      });
      setShowDecisionModal(false);
      await fetchDraftData();
    } catch (err) {
      setDecisionError(err.response?.data?.detail || 'Decision submission failed.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,101,0,0.3)', borderTopColor: '#FF6500', borderRadius: '50%', margin: '0 auto 12px' }} className="animate-spin" />
        Loading draft verification details...
      </div>
    );
  }

  if (!draft) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
        Draft not found in this workspace.
      </div>
    );
  }

  const isCreatorOfDraft = draft.creator_id === user?.user_id;
  const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'owner';
  const unresolvedCritical = findings.filter(f => f.severity === 'critical' && !f.is_resolved);
  const unresolvedHigh = findings.filter(f => f.severity === 'high' && !f.is_resolved);
  const requiresOverride = (unresolvedCritical.length > 0 || unresolvedHigh.length > 0);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', label: 'READY TO PUBLISH' };
      case 'under_review':
        return { bg: 'rgba(255, 101, 0, 0.12)', border: '1px solid rgba(255, 101, 0, 0.35)', color: '#FF8533', label: 'UNDER REVIEW' };
      case 'changes_requested':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', label: 'CHANGES REQUESTED' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', label: status?.toUpperCase() || 'DRAFT' };
    }
  };

  const statusBadge = getStatusBadgeStyle(draft.status);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {draft.title}
            </h1>
            <span style={{
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: statusBadge.bg,
              border: statusBadge.border,
              color: statusBadge.color,
            }}>
              {statusBadge.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)' }}>
            <span>Target: <strong style={{ color: '#fff' }}>{draft.target_product || 'General'}</strong></span>
            <span>·</span>
            <span>Audience: <strong style={{ color: '#fff' }}>{draft.target_audience}</strong></span>
            <span>·</span>
            <span>Creator: <strong style={{ color: '#fff' }}>{draft.creator_name || 'Creator'}</strong></span>
            <span>·</span>
            <span>Draft ID: <strong style={{ color: '#FF8533', fontFamily: 'monospace' }}>{draft.draft_id}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReverify}
            disabled={reverifying}
            className="btn-ghost"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            title="Re-run verification engine against active sources"
          >
            <RefreshCw size={14} className={reverifying ? 'animate-spin' : ''} style={{ color: reverifying ? '#FF6500' : 'inherit' }} />
            Re-verify
          </button>

          {isReviewerOrAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleOpenDecision('changes_requested')}
                style={{
                  padding: '9px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Request Changes
              </button>
              <button
                onClick={() => handleOpenDecision('approved')}
                disabled={isCreatorOfDraft}
                className="btn-orange"
                style={{ padding: '9px 18px', fontSize: '0.8rem' }}
                title={isCreatorOfDraft ? "Separation of duties: Creators cannot approve their own drafts." : "Approve and mark Ready to Publish"}
              >
                Approve Draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ready to Publish Success Banner */}
      {draft.ready_to_publish && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={20} color="#34d399" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', margin: 0 }}>
                Ready to Publish — Formal Brand Approval Granted
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', margin: '4px 0 0 0' }}>
                This content satisfies verified specifications and brand governance policies. Approved snapshot permanently preserved.
              </p>
            </div>
          </div>
          <span style={{
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            Status: READY_TO_PUBLISH
          </span>
        </div>
      )}

      {/* Self-Approval Warning */}
      {isCreatorOfDraft && draft.status !== 'approved' && (
        <div style={{
          background: 'rgba(255, 101, 0, 0.06)',
          border: '1px solid rgba(255, 101, 0, 0.2)',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF8533' }}>
            <Lock size={15} />
            <span>You submitted this draft. Under brand governance separation of concerns, another team member (Reviewer or Admin) must approve it.</span>
          </div>
          <button
            onClick={() => setIsRevising(!isRevising)}
            className="btn-orange"
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            {isRevising ? 'Close Revision Editor' : 'Edit & Submit Revision'}
          </button>
        </div>
      )}

      {/* Main Grid: Content Viewer & Verification Findings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
        {/* Left Column: Content & Revision History (5 cols) */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="#FF6500" />
                Submitted Marketing Copy
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#FF8533', fontWeight: 600 }}>
                Revision #{history?.revisions?.length || 1}
              </span>
            </div>

            {!isRevising ? (
              <div>
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#0d0d0d',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  minHeight: '140px',
                }}>
                  {draft.latest_content_text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.35)' }}>
                    Hash: <strong style={{ fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)' }}>{history?.revisions?.[history.revisions.length - 1]?.content_hash?.slice(0, 12)}...</strong>
                  </span>
                  <button
                    onClick={() => {
                      setRevisionText(draft.latest_content_text);
                      setIsRevising(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FF8533',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3 size={13} />
                    Edit & Revise
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitRevision} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF8533' }}>
                    Create Revision #{((history?.revisions?.length) || 1) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRevising(false)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  rows={7}
                  required
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="Apply suggested corrections and revise marketing copy..."
                  className="input-dark"
                  style={{ fontFamily: 'monospace', lineHeight: '1.6', resize: 'vertical' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                    Re-analyzes claims upon submission.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingRev}
                    className="btn-orange"
                    style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                  >
                    {submittingRev ? 'Re-analyzing...' : 'Submit Revision'}
                    <Send size={13} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Revision Progression */}
          {history?.revisions && history.revisions.length > 1 && (
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitBranch size={14} color="#FF6500" />
                Revision Progression ({history.revisions.length} Revisions)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.revisions.map((rev) => (
                  <div key={rev.revision_id} style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <strong style={{ color: '#fff' }}>Revision #{rev.revision_number}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.35)', marginLeft: '8px' }}>
                        {new Date(rev.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <Link
                      to={`/insights?draft_id=${draftId}&base_rev=${history.revisions[0].revision_id}&new_rev=${rev.revision_id}`}
                      style={{ fontSize: '0.75rem', color: '#FF8533', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Compare Diff →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recorded Decisions */}
          {history?.decisions && history.decisions.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>
                Recorded Review Decisions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.decisions.map((dec) => (
                  <div key={dec.decision_id} style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.78rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{
                        fontWeight: 700,
                        color: dec.decision === 'approved' ? '#34d399' : '#f87171',
                        textTransform: 'capitalize',
                      }}>
                        {dec.decision === 'approved' ? 'Approved' : 'Changes Requested'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        By {dec.reviewer_name}
                      </span>
                    </div>
                    {dec.comment && (
                      <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontStyle: 'italic', margin: '4px 0 0 0' }}>"{dec.comment}"</p>
                    )}
                    {dec.override_reason && (
                      <p style={{ color: '#fbbf24', fontSize: '0.72rem', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        Override Justification: {dec.override_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Verification Findings (7 cols) */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <ShieldCheck size={20} color="#FF6500" />
                  Verification Engine Findings
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                  {findings.length === 0
                    ? 'No discrepancies detected. Draft is fully compliant.'
                    : `${findings.length} issue${findings.length > 1 ? 's' : ''} identified against approved brand specifications.`}
                </p>
              </div>

              <span style={{
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: findings.length === 0 ? 'rgba(16, 185, 129, 0.12)' : requiresOverride ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 101, 0, 0.12)',
                border: findings.length === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : requiresOverride ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 101, 0, 0.3)',
                color: findings.length === 0 ? '#34d399' : requiresOverride ? '#f87171' : '#FF8533',
              }}>
                {findings.length === 0 ? 'CLEAN / COMPLIANT' : requiresOverride ? 'REQUIRES OVERRIDE' : 'FLAGGED'}
              </span>
            </div>

            {/* Severities Tally */}
            {findings.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '18px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.75rem',
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>Issue Severity:</span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>
                  {findings.filter(f => f.severity === 'critical').length} Critical
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 101, 0, 0.12)', border: '1px solid rgba(255, 101, 0, 0.3)', color: '#FF8533', fontFamily: 'monospace', fontWeight: 700 }}>
                  {findings.filter(f => f.severity === 'high').length} High
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
                  {findings.filter(f => f.severity === 'medium').length} Medium
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace', fontWeight: 700 }}>
                  {findings.filter(f => f.severity === 'low' || f.severity === 'info').length} Low/Info
                </span>
              </div>
            )}

            {/* List of Findings */}
            {findings.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <CheckCircle size={36} color="#34d399" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', margin: 0 }}>100% Brand Verification Pass</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                  All claims, numbers, and terminology match approved sources.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {findings.map((finding) => (
                  <FindingCard
                    key={finding.finding_id}
                    finding={finding}
                    onApplySuggestion={handleApplySuggestion}
                    onResolvedChange={() => fetchDraftData()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer Decision Modal */}
      {showDecisionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid rgba(255, 101, 0, 0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Record Reviewer Decision
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)', margin: '6px 0 18px 0' }}>
              Your decision, comments, and cited source snapshot will be permanently recorded in the immutable audit trail.
            </p>

            {decisionError && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
              }}>
                {decisionError}
              </div>
            )}

            <form onSubmit={handleSubmitDecision} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Decision Action</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDecisionType('approved')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      border: decisionType === 'approved' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: decisionType === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: decisionType === 'approved' ? '#34d399' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Approve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('changes_requested')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      border: decisionType === 'changes_requested' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: decisionType === 'changes_requested' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: decisionType === 'changes_requested' ? '#f87171' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Request Changes
                  </button>
                </div>
              </div>

              {decisionType === 'approved' && requiresOverride && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 101, 0, 0.08)',
                  border: '1px solid rgba(255, 101, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF8533' }}>
                    <AlertTriangle size={16} />
                    <strong style={{ fontSize: '0.82rem' }}>Override Reason Required</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                    This draft contains {unresolvedCritical.length + unresolvedHigh.length} unresolved critical/high findings. You must document a formal justification to approve.
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document legal, executive, or test justification for approving content with unresolved findings..."
                    className="input-dark"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Reviewer Comment / Feedback</label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Provide feedback for content creator or release notes..."
                  className="input-dark"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="btn-orange"
                  style={{
                    background: decisionType === 'approved' ? '#10b981' : '#ef4444',
                    boxShadow: decisionType === 'approved' ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 20px rgba(239,68,68,0.3)',
                  }}
                >
                  {submittingDecision ? 'Submitting...' : `Confirm ${decisionType === 'approved' ? 'Approval' : 'Changes Request'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
