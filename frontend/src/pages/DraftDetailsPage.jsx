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
      // Automatically run verification on the new revision
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
    // Replace text in revision editor
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
      <div className="py-24 text-center text-xs text-slate-400">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading draft verification details...
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Draft not found in this workspace.
      </div>
    );
  }

  const isCreatorOfDraft = draft.creator_id === user?.user_id;
  const isReviewerOrAdmin = user?.role === 'reviewer' || user?.role === 'admin' || user?.role === 'owner';
  const unresolvedCritical = findings.filter(f => f.severity === 'critical' && !f.is_resolved);
  const unresolvedHigh = findings.filter(f => f.severity === 'high' && !f.is_resolved);
  const requiresOverride = (unresolvedCritical.length > 0 || unresolvedHigh.length > 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 shadow-sm shadow-emerald-900/30';
      case 'under_review':
        return 'bg-indigo-950/80 text-cyan-300 border-indigo-600/50';
      case 'changes_requested':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/50';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{draft.title}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(draft.status)}`}>
              {draft.status === 'approved' ? 'READY TO PUBLISH' : draft.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span>Target: <strong className="text-slate-200">{draft.target_product || 'General'}</strong></span>
            <span>·</span>
            <span>Audience: <strong className="text-slate-200">{draft.target_audience}</strong></span>
            <span>·</span>
            <span>Creator: <strong className="text-slate-200">{draft.creator_name || 'Creator'}</strong></span>
            <span>·</span>
            <span>Draft ID: <strong className="text-slate-400 font-mono">{draft.draft_id}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReverify}
            disabled={reverifying}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Re-run verification engine against active sources"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reverifying ? 'animate-spin text-cyan-400' : ''}`} />
            Re-verify
          </button>

          {isReviewerOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDecision('changes_requested')}
                className="px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-800/60 text-xs font-semibold transition-all"
              >
                Request Changes
              </button>
              <button
                onClick={() => handleOpenDecision('approved')}
                disabled={isCreatorOfDraft}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-300">
                Ready to Publish — Formal Brand Approval Granted
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                This content satisfies verified specifications and brand governance policies. Approved revision snapshot is permanently recorded.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-xs font-mono font-semibold">
            Status: READY_TO_PUBLISH
          </span>
        </div>
      )}

      {/* Self-Approval Warning if Creator is Viewing */}
      {isCreatorOfDraft && draft.status !== 'approved' && (
        <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span>You submitted this draft. Under brand governance separation of concerns, another team member (Reviewer or Admin) must approve it.</span>
          </div>
          <button
            onClick={() => setIsRevising(!isRevising)}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all"
          >
            {isRevising ? 'Close Revision Editor' : 'Edit & Submit Revision'}
          </button>
        </div>
      )}

      {/* Main Grid: Content Viewer & Verification Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Content & Revision Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-cyan-400" />
                Submitted Marketing Copy
              </span>
              <span className="text-xs font-mono text-slate-400">
                Revision #{history?.revisions?.length || 1}
              </span>
            </div>

            {/* Content Display */}
            {!isRevising ? (
              <div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap min-h-40">
                  {draft.latest_content_text}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Hash: <strong className="font-mono text-slate-300">{history?.revisions?.[history.revisions.length - 1]?.content_hash?.slice(0, 12)}...</strong>
                  </span>
                  <button
                    onClick={() => {
                      setRevisionText(draft.latest_content_text);
                      setIsRevising(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit & Revise
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Revision Editor */
              <form onSubmit={handleSubmitRevision} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-300">
                    Create Revision #{((history?.revisions?.length) || 1) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRevising(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  rows={6}
                  required
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="Apply suggested corrections and revise marketing copy..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-indigo-700/60 font-mono text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Submitting creates an immutable revision and re-analyzes claims.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingRev}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingRev ? 'Re-analyzing...' : 'Submit Revision'}
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Revision History Log */}
          {history?.revisions && history.revisions.length > 1 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
                Revision Progression ({history.revisions.length} Revisions)
              </h4>
              <div className="space-y-2">
                {history.revisions.map((rev) => (
                  <div key={rev.revision_id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-slate-200">Revision #{rev.revision_number}</strong>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(rev.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <Link
                      to={`/insights?draft_id=${draftId}&base_rev=${history.revisions[0].revision_id}&new_rev=${rev.revision_id}`}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      Compare Diff →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Decisions Card */}
          {history?.decisions && history.decisions.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recorded Review Decisions
              </h4>
              <div className="space-y-2">
                {history.decisions.map((dec) => (
                  <div key={dec.decision_id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold capitalize ${dec.decision === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {dec.decision === 'approved' ? 'Approved' : 'Changes Requested'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        By {dec.reviewer_name}
                      </span>
                    </div>
                    {dec.comment && (
                      <p className="text-slate-300 italic">"{dec.comment}"</p>
                    )}
                    {dec.override_reason && (
                      <p className="text-amber-300 text-[11px] mt-1 border-t border-slate-800 pt-1">
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
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  Verification Engine Findings
                </h3>
                <p className="text-xs text-slate-400">
                  {findings.length === 0
                    ? 'No discrepancies detected. Draft is fully compliant.'
                    : `${findings.length} issue${findings.length > 1 ? 's' : ''} identified against approved brand specifications.`}
                </p>
              </div>

              {/* Status summary pill */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                findings.length === 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                  : requiresOverride
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-600/50'
              }`}>
                {findings.length === 0 ? 'CLEAN / COMPLIANT' : requiresOverride ? 'REQUIRES OVERRIDE' : 'FLAGGED'}
              </span>
            </div>

            {/* Severities Tally */}
            {findings.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Issue Severity:</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[11px]">
                  {findings.filter(f => f.severity === 'critical').length} Critical
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono text-[11px]">
                  {findings.filter(f => f.severity === 'high').length} High
                </span>
                <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 font-mono text-[11px]">
                  {findings.filter(f => f.severity === 'medium').length} Medium
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                  {findings.filter(f => f.severity === 'low' || f.severity === 'info').length} Low/Info
                </span>
              </div>
            )}

            {/* List of Findings */}
            {findings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-200">100% Brand Verification Pass</p>
                <p className="mt-1">All claims, numbers, and terminology match approved sources.</p>
              </div>
            ) : (
              <div className="space-y-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Record Reviewer Decision
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your decision, comments, and cited source snapshot will be permanently recorded in the immutable audit trail.
            </p>

            {decisionError && (
              <div className="mb-4 rounded-lg bg-rose-950/60 border border-rose-800 p-3 text-xs text-rose-300">
                {decisionError}
              </div>
            )}

            <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Decision Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('approved')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      decisionType === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Approve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('changes_requested')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      decisionType === 'changes_requested'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Request Changes
                  </button>
                </div>
              </div>

              {/* Explicit Override Reason required if critical/high issues unresolved */}
              {decisionType === 'approved' && requiresOverride && (
                <div className="rounded-xl bg-amber-950/30 border border-amber-800/60 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="block font-semibold">Override Reason Required</strong>
                      <span className="text-[11px] text-amber-300/80">
                        This draft contains {unresolvedCritical.length + unresolvedHigh.length} unresolved critical/high findings. You must document a formal justification to approve.
                      </span>
                    </div>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document legal, executive, or test justification for approving content with unresolved findings..."
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-amber-700/60 text-white placeholder-slate-500 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reviewer Comment / Feedback</label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Provide feedback for content creator or release notes..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className={`px-4 py-2 rounded-lg font-semibold text-white text-xs shadow-md ${
                    decisionType === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
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
