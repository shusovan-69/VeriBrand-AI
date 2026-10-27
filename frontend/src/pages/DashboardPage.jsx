import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertOctagon,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Sparkles,
  GitCompare,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { dashboardApi, draftsApi, insightsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [sourceAlerts, setSourceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, draftsRes, actRes, alertsRes] = await Promise.all([
        dashboardApi.getStats(),
        draftsApi.getDrafts(),
        dashboardApi.getActivity(8),
        insightsApi.getSourceAlerts()
      ]);
      setStats(statsRes.data);
      setRecentDrafts(draftsRes.data.slice(0, 5));
      setActivity(actRes.data);
      setSourceAlerts(alertsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
      case 'under_review':
        return 'bg-indigo-950/80 text-cyan-300 border-indigo-600/50';
      case 'changes_requested':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/50';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Governance Dashboard
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Live Data
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <strong className="text-slate-200">{user?.full_name}</strong> ({user?.role?.toUpperCase()}) · Workspace: {user?.workspace_name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/submit"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <FileText className="h-4 w-4" />
            Submit New Draft
          </Link>
        </div>
      </div>

      {/* Round 3 Improvement 1: Source-Change Alerts Banner */}
      {sourceAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  {sourceAlerts.length} Source-Change Alert{sourceAlerts.length > 1 ? 's' : ''} Detected
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Brand guidelines or approved specifications have been updated. Previously approved content citing these sources requires re-review while historical decisions are retained.
                </p>
              </div>
            </div>
            <Link
              to="/insights"
              className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-medium shrink-0 transition-all"
            >
              Inspect Affected Drafts
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Drafts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Submissions</span>
            <FileText className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '...' : stats?.total_drafts ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Marketing copy & PDFs</p>
        </div>

        {/* Pending Reviews */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {loading ? '...' : stats?.pending_reviews ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting compliance review</p>
        </div>

        {/* Ready to Publish */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Ready to Publish</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {loading ? '...' : stats?.approved_content ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Approved & grounded</p>
        </div>

        {/* Flagged Issues */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Flagged Issues</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {loading ? '...' : stats?.flagged_issues ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Contradictions & breaches</p>
        </div>
      </div>

      {/* Main Content Area: Recent Submissions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Drafts (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Recent Marketing Content</h2>
              <p className="text-xs text-slate-400">Track verification status, revisions and reviewer decisions</p>
            </div>
            <Link to="/submit" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              New Draft <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading drafts...</div>
          ) : recentDrafts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No drafts submitted yet in this workspace.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentDrafts.map((d) => (
                <div key={d.draft_id} className="py-3.5 flex items-center justify-between gap-4 group">
                  <div className="min-w-0">
                    <Link
                      to={`/drafts/${d.draft_id}`}
                      className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate block"
                    >
                      {d.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>Product: <strong className="text-slate-300">{d.target_product || 'General'}</strong></span>
                      <span>·</span>
                      <span>By {d.creator_name || 'Creator'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(d.status)}`}>
                      {d.status === 'approved' ? 'Ready to Publish' : d.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <Link
                      to={`/drafts/${d.draft_id}`}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Inspect findings and revisions"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Audit Trail & Fast Actions (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Governance Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/guidelines"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  <span>Approved Guidelines & Facts</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                to="/reviews"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Reviewer Approval Queue</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                to="/insights"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <GitCompare className="h-4 w-4 text-cyan-400" />
                  <span>Revision Diff & Insights (R3)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                to="/image-review"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="h-4 w-4 text-indigo-400" />
                  <span>Limited Image Brand Check (R3)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Audit Stream */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Audit Events</h3>
              <Link to="/activity" className="text-[11px] text-cyan-400 hover:text-cyan-300">View All</Link>
            </div>

            <div className="space-y-3">
              {activity.slice(0, 4).map((evt) => (
                <div key={evt.event_id} className="text-xs border-l-2 border-indigo-500/60 pl-3 py-0.5">
                  <p className="text-slate-300 font-medium line-clamp-2">{evt.details}</p>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {evt.actor_name} · {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
