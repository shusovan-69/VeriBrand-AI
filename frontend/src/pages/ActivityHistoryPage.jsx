import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, User, Shield, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { dashboardApi } from '../services/api';

export default function ActivityHistoryPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getActivity(50);
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'draft_approved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
      case 'changes_requested':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/50';
      case 'verification_completed':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50';
      case 'draft_submitted':
      case 'revision_submitted':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-600/50';
      case 'guideline_updated':
      case 'approved_fact_updated':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredEvents = events.filter((e) =>
    e.details.toLowerCase().includes(search.toLowerCase()) ||
    e.actor_name.toLowerCase().includes(search.toLowerCase()) ||
    e.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-indigo-400" />
            Workspace Audit Trail & Activity Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all user registrations, content submissions, verification runs, and reviewer decisions.
          </p>
        </div>

        <button
          onClick={fetchActivity}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
          title="Refresh audit events"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by actor or description..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Events List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No events found matching your query.</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredEvents.map((evt) => (
              <div key={evt.event_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${getActionBadge(evt.action)}`}>
                      {evt.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">by</span>
                    <strong className="text-xs text-slate-200">{evt.actor_name}</strong>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{evt.details}</p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {new Date(evt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
