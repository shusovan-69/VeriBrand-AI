import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { draftsApi, insightsApi } from '../services/api';

export default function RevisionInsightsPage() {
  const [searchParams] = useSearchParams();
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(searchParams.get('draft_id') || '');
  const [revisions, setRevisions] = useState([]);
  const [baseRev, setBaseRev] = useState(searchParams.get('base_rev') || '');
  const [newRev, setNewRev] = useState(searchParams.get('new_rev') || '');

  const [diffData, setDiffData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Fetch initial drafts list and trends
  useEffect(() => {
    draftsApi.getDrafts().then((res) => {
      setDrafts(res.data);
      if (!selectedDraftId && res.data.length > 0) {
        setSelectedDraftId(res.data[0].draft_id);
      }
    }).catch(console.error);

    insightsApi.getTrends().then((res) => {
      setTrends(res.data);
    }).catch(console.error);

    insightsApi.getSourceAlerts().then((res) => {
      setAlerts(res.data);
    }).catch(console.error);
  }, []);

  // Fetch revisions when selectedDraftId changes
  useEffect(() => {
    if (!selectedDraftId) return;
    draftsApi.getDraftHistory(selectedDraftId).then((res) => {
      const revs = res.data.revisions || [];
      setRevisions(revs);
      if (revs.length >= 2) {
        setBaseRev(revs[0].revision_id);
        setNewRev(revs[revs.length - 1].revision_id);
      } else if (revs.length === 1) {
        setBaseRev(revs[0].revision_id);
        setNewRev(revs[0].revision_id);
      }
    }).catch(console.error);
  }, [selectedDraftId]);

  // Fetch diff comparison
  const handleCompare = async () => {
    if (!selectedDraftId || !baseRev || !newRev) return;
    setLoadingDiff(true);
    try {
      const res = await insightsApi.compareRevisions(selectedDraftId, baseRev, newRev);
      setDiffData(res.data);
    } catch (err) {
      console.error('Failed to compare revisions:', err);
    } finally {
      setLoadingDiff(false);
    }
  };

  useEffect(() => {
    if (selectedDraftId && baseRev && newRev) {
      handleCompare();
    }
  }, [selectedDraftId, baseRev, newRev]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Round 3 Improvements: Insights & Source-Change Tracing
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <GitCompare className="h-6 w-6 text-indigo-400" />
          Revision Analytics & Source Alerts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Compare revisions side-by-side, observe resolved vs introduced issues, and audit source-change re-review triggers.
        </p>
      </div>

      {/* Source-Change Alerts Section (Improvement 1) */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Active Source-Change Re-Review Alerts ({alerts.length})
          </h2>
          <p className="text-xs text-slate-300 mb-4">
            The following drafts cited a source version that has since been updated by administrators. Historical decisions remain recorded, but re-evaluation is advised:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alt) => (
              <div key={alt._id || alt.alert_id} className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-800/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-cyan-300 font-semibold">{alt.source_id}</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 font-mono">
                    {alt.old_version} → {alt.new_version}
                  </span>
                </div>
                <p className="text-slate-300 mt-1">{alt.message}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Draft: {alt.draft_id}</span>
                  <Link
                    to={`/drafts/${alt.draft_id}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    Audit Draft <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revision Diff Comparison Controls (Improvement 3) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-cyan-400" />
          Cross-Revision Difference Comparison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select Marketing Draft</label>
            <select
              value={selectedDraftId}
              onChange={(e) => setSelectedDraftId(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              {drafts.map((d) => (
                <option key={d.draft_id} value={d.draft_id}>
                  {d.title} ({d.draft_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Base Revision (Before)</label>
            <select
              value={baseRev}
              onChange={(e) => setBaseRev(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
            >
              {revisions.map((r) => (
                <option key={r.revision_id} value={r.revision_id}>
                  Revision #{r.revision_number} ({r.revision_id.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">New Revision (After)</label>
            <select
              value={newRev}
              onChange={(e) => setNewRev(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
            >
              {revisions.map((r) => (
                <option key={r.revision_id} value={r.revision_id}>
                  Revision #{r.revision_number} ({r.revision_id.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Results Output */}
        {loadingDiff ? (
          <div className="py-8 text-center text-xs text-slate-400">Computing revision delta...</div>
        ) : diffData && (
          <div className="space-y-4 pt-3 border-t border-slate-800">
            {/* Diff Summary Counters */}
            <div className="grid grid-cols-3 gap-3 text-xs text-center font-mono">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                <div className="text-xl font-bold text-emerald-400">{diffData.resolved_count}</div>
                <span className="text-[11px] text-slate-300">Issues Resolved</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60">
                <div className="text-xl font-bold text-rose-400">{diffData.new_issues_count}</div>
                <span className="text-[11px] text-slate-300">New Issues Introduced</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
                <div className="text-xl font-bold text-amber-400">{diffData.persistent_count}</div>
                <span className="text-[11px] text-slate-300">Unresolved Issues</span>
              </div>
            </div>

            {/* Unified Line Diff Block */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1.5">Unified Text Changes:</p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed">
                {diffData.text_diff && diffData.text_diff.length > 0 ? (
                  diffData.text_diff.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith('+')
                          ? 'text-emerald-400 bg-emerald-950/30 px-1 py-0.5 rounded'
                          : line.startsWith('-')
                          ? 'text-rose-400 bg-rose-950/30 px-1 py-0.5 rounded'
                          : line.startsWith('@')
                          ? 'text-cyan-400 font-bold'
                          : 'text-slate-400'
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">No textual differences between selected revisions.</span>
                )}
              </div>
            </div>

            {/* Resolved vs Persistent Findings Breakdown */}
            {diffData.resolved_issues?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Corrected in New Revision:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {diffData.resolved_issues.map((iss, i) => (
                    <li key={i}>
                      <span className="font-mono text-rose-300">"{iss.original_text}"</span>: {iss.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Recurring Trends Summary */}
      {trends && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Workspace Violation Trends & Recurring Mistakes
              </h3>
              <p className="text-xs text-slate-400">Aggregate statistics from all historical analysis runs across the workspace.</p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Total Recorded Violations: <strong className="text-white">{trends.total_violations_recorded}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Top Violated Rules */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">Top Violated Source Rules:</span>
              {trends.top_violated_rules?.length === 0 ? (
                <div className="text-slate-500">No violations recorded yet.</div>
              ) : (
                trends.top_violated_rules.map((rule) => (
                  <div key={rule.rule_id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-cyan-300 font-medium">{rule.rule_id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono font-bold">
                      {rule.count} breach{rule.count > 1 ? 'es' : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Top Flagged Phrases */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">Most Frequently Flagged Claims:</span>
              {trends.top_flagged_phrases?.length === 0 ? (
                <div className="text-slate-500">No claims flagged yet.</div>
              ) : (
                trends.top_flagged_phrases.map((phrase, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-rose-300 font-medium">"{phrase.phrase}"</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono font-bold">
                      {phrase.count}x
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
