import React, { useState } from 'react';
import { SeverityBadge, CategoryBadge, EvidenceStatusBadge } from './FindingBadge';
import { BookOpen, Check, Copy, ArrowRight, CheckCircle2, FileQuestion, Sparkles } from 'lucide-react';
import { verificationApi } from '../services/api';

export default function FindingCard({ finding, onResolvedChange, onApplySuggestion }) {
  const [isResolved, setIsResolved] = useState(finding.is_resolved || false);
  const [resolving, setResolving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggleResolve = async () => {
    setResolving(true);
    try {
      const nextState = !isResolved;
      await verificationApi.resolveFinding(finding.finding_id, {
        resolved: nextState,
        resolution_note: nextState ? "Resolved during creator/reviewer review" : ""
      });
      setIsResolved(nextState);
      if (onResolvedChange) {
        onResolvedChange(finding.finding_id, nextState);
      }
    } catch (err) {
      console.error("Failed to toggle resolve:", err);
    } finally {
      setResolving(false);
    }
  };

  const handleCopySuggestion = () => {
    if (finding.suggested_revision) {
      navigator.clipboard.writeText(finding.suggested_revision);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCritical = finding.severity === 'critical';

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isResolved
          ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
          : isCritical
          ? 'bg-gradient-to-b from-rose-950/20 to-slate-900 border-rose-900/50 shadow-md shadow-rose-950/20'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Category, Severity, and Evidence Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={finding.category} />
          <SeverityBadge severity={finding.severity} />
        </div>
        <EvidenceStatusBadge status={finding.evidence_status} />
      </div>

      {/* Flagged Draft Snippet */}
      <div className="mb-3 rounded-lg bg-slate-950/80 border border-slate-800 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Draft Claim / Excerpt Flagged:
        </p>
        <span className="inline-block px-2 py-1 rounded bg-rose-950/50 text-rose-300 font-mono text-xs border border-rose-800/50">
          "{finding.original_text}"
        </span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {finding.explanation}
      </p>

      {/* Grounded Evidence Citation (Section 6 & 7) */}
      {finding.source_id ? (
        <div className="mb-4 rounded-lg bg-indigo-950/30 border border-indigo-900/40 p-3 text-xs">
          <div className="flex items-center justify-between text-indigo-300 font-medium mb-1.5">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span>Grounded Approved Citation:</span>
            </div>
            <span className="font-mono bg-indigo-900/60 text-cyan-300 px-2 py-0.5 rounded border border-indigo-700/50 text-[11px]">
              {finding.source_id} ({finding.source_version || 'v1.0'})
            </span>
          </div>
          {finding.source_excerpt && (
            <p className="text-slate-300 italic border-l-2 border-indigo-500 pl-2 mt-1">
              "{finding.source_excerpt}"
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4 rounded-lg bg-amber-950/20 border border-amber-900/30 p-2.5 text-xs text-amber-300/90 flex items-center gap-2">
          <FileQuestion className="h-4 w-4 shrink-0 text-amber-400" />
          <span>No supporting approved specification found in workspace sources.</span>
        </div>
      )}

      {/* Suggested Intent-Preserving Revision */}
      {finding.suggested_revision && (
        <div className="mb-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested Intent-Preserving Revision
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySuggestion}
                className="flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 transition-colors"
                title="Copy suggestion to clipboard"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(finding.original_text, finding.suggested_revision)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-200 border border-emerald-600/40 transition-colors"
                >
                  <ArrowRight className="h-3 w-3" />
                  Apply
                </button>
              )}
            </div>
          </div>
          <p className="text-xs font-mono text-emerald-200">
            {finding.suggested_revision}
          </p>
        </div>
      )}

      {/* Resolution Checkbox */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={isResolved}
            onChange={handleToggleResolve}
            disabled={resolving}
            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          />
          <span>{isResolved ? 'Marked as Resolved' : 'Mark issue as resolved'}</span>
        </label>
        {isResolved && (
          <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Addressed
          </span>
        )}
      </div>
    </div>
  );
}
