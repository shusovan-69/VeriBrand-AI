import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertOctagon, AlertTriangle, ArrowRight, RefreshCw, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { approvalsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReviewerQueuePage() {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await approvalsApi.getPendingReviews();
      setPendingItems(res.data);
    } catch (err) {
      console.error('Failed to fetch pending reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredItems = pendingItems.filter((item) => {
    if (filter === 'critical') return item.critical_findings_count > 0;
    if (filter === 'clean') return item.total_findings === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-emerald-400" />
            Compliance Reviewer Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submissions awaiting evidence audit, contradiction resolution, or final publishing approval.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
          title="Refresh queue"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Pending ({pendingItems.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'critical'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Critical Contradictions ({pendingItems.filter(i => i.critical_findings_count > 0).length})
        </button>
        <button
          onClick={() => setFilter('clean')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'clean'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Clean / Ready for Pass ({pendingItems.filter(i => i.total_findings === 0).length})
        </button>
      </div>

      {/* Queue List Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading reviewer queue...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-200">Review queue is empty</p>
            <p className="mt-1">All submitted content in this workspace has been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Draft Title & Product</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Severity Breakdown</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.draft_id} className="hover:bg-slate-900/90 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/drafts/${item.draft_id}`}
                        className="font-bold text-slate-100 hover:text-cyan-400 transition-colors block text-sm"
                      >
                        {item.title}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        Product: {item.target_product || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      Rev #{item.revision_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.creator_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        {item.critical_findings_count > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-semibold flex items-center gap-1">
                            <AlertOctagon className="h-3 w-3 text-rose-400" />
                            {item.critical_findings_count} Critical
                          </span>
                        )}
                        {item.high_findings_count > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            {item.high_findings_count} High
                          </span>
                        )}
                        {item.total_findings === 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
                            Clean (0 Issues)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/drafts/${item.draft_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
                      >
                        Audit & Decide
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
