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
  RefreshCw,
  Zap,
  Activity
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

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          label: 'Ready to Publish'
        };
      case 'under_review':
        return {
          bg: 'rgba(255, 101, 0, 0.12)',
          border: '1px solid rgba(255, 101, 0, 0.3)',
          color: '#FF8533',
          label: 'Under Review'
        };
      case 'changes_requested':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          label: 'Changes Requested'
        };
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          label: status?.replace('_', ' ').toUpperCase() || 'DRAFT'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Governance Dashboard
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'rgba(255, 101, 0, 0.12)',
              border: '1px solid rgba(255, 101, 0, 0.25)',
              color: '#FF8533',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6500' }} />
              Live Engine
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px' }}>
            Welcome, <strong style={{ color: '#fff' }}>{user?.full_name}</strong> ({user?.role?.toUpperCase()}) · Workspace: <span style={{ color: '#FF8533' }}>{user?.workspace_name}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-ghost"
            style={{ padding: '8px 12px' }}
            title="Refresh dashboard"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/submit" className="btn-orange" style={{ textDecoration: 'none' }}>
            <FileText size={15} />
            Submit New Draft
          </Link>
        </div>
      </div>

      {/* Source-Change Alerts Banner */}
      {sourceAlerts.length > 0 && (
        <div style={{
          background: 'rgba(255, 101, 0, 0.07)',
          border: '1px solid rgba(255, 101, 0, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 101, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={18} color="#FF8533" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF8533', margin: 0 }}>
                {sourceAlerts.length} Source-Change Alert{sourceAlerts.length > 1 ? 's' : ''} Detected
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Brand specifications updated by administrators. Previously approved drafts citing outdated versions require re-audit.
              </p>
            </div>
          </div>
          <Link
            to="/insights"
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 101, 0, 0.15)',
              border: '1px solid rgba(255, 101, 0, 0.3)',
              color: '#FF8533',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            Inspect Affected Drafts →
          </Link>
        </div>
      )}

      {/* 4 KPI Cards (Bento style) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Drafts */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>Total Submissions</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 101, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="#FF6500" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff' }}>
            {loading ? '...' : stats?.total_drafts ?? 0}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>Marketing copy & PDF campaigns</p>
        </div>

        {/* Pending Reviews */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>Pending Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#fbbf24' }}>
            {loading ? '...' : stats?.pending_reviews ?? 0}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>Awaiting compliance review</p>
        </div>

        {/* Ready to Publish */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>Ready to Publish</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#34d399' }}>
            {loading ? '...' : stats?.approved_content ?? 0}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>Grounded & approved</p>
        </div>

        {/* Flagged Issues */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)' }}>Flagged Issues</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertOctagon size={16} color="#f87171" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#f87171' }}>
            {loading ? '...' : stats?.flagged_issues ?? 0}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '4px' }}>Contradictions & breaches</p>
        </div>
      </div>

      {/* Main Grid: Left Recent Content (2/3) + Right Quick Actions (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left: Recent Drafts */}
        <div className="card" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Recent Marketing Content</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                Track verification status, revisions and reviewer decisions
              </p>
            </div>
            <Link to="/submit" style={{ fontSize: '0.78rem', color: '#FF8533', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              New Draft <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              Loading drafts...
            </div>
          ) : recentDrafts.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              No drafts submitted yet in this workspace.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentDrafts.map((d, idx) => {
                const bStyle = getStatusBadgeStyle(d.status);
                return (
                  <div
                    key={d.draft_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: idx < recentDrafts.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                      gap: '12px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link
                        to={`/drafts/${d.draft_id}`}
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: '#fff',
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#FF8533'}
                        onMouseOut={e => e.currentTarget.style.color = '#fff'}
                      >
                        {d.title}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        <span>Product: <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{d.target_product || 'General'}</strong></span>
                        <span>·</span>
                        <span>By {d.creator_name || 'Creator'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: bStyle.bg,
                        border: bStyle.border,
                        color: bStyle.color,
                        letterSpacing: '0.03em',
                      }}>
                        {bStyle.label}
                      </span>
                      <Link
                        to={`/drafts/${d.draft_id}`}
                        style={{
                          padding: '6px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,101,0,0.15)'; e.currentTarget.style.color = '#FF8533'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'; }}
                        title="Inspect findings and revisions"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Audit Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Quick Actions */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>
              Governance Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/guidelines"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.3)'; e.currentTarget.style.color = '#FF8533'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={15} color="#c084fc" />
                  <span>Approved Guidelines & Facts</span>
                </div>
                <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
              </Link>

              <Link
                to="/reviews"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.3)'; e.currentTarget.style.color = '#FF8533'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#34d399" />
                  <span>Reviewer Approval Queue</span>
                </div>
                <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
              </Link>

              <Link
                to="/insights"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.3)'; e.currentTarget.style.color = '#FF8533'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitCompare size={15} color="#38bdf8" />
                  <span>Revision Diff & Insights</span>
                </div>
                <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
              </Link>

              <Link
                to="/image-review"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.3)'; e.currentTarget.style.color = '#FF8533'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={15} color="#FF8533" />
                  <span>Visual Brand Asset Review</span>
                </div>
                <ArrowRight size={13} color="rgba(255,255,255,0.3)" />
              </Link>
            </div>
          </div>

          {/* Audit Stream */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
                Recent Audit Events
              </h3>
              <Link to="/activity" style={{ fontSize: '0.72rem', color: '#FF8533', textDecoration: 'none', fontWeight: 600 }}>
                View All
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activity.slice(0, 4).map((evt) => (
                <div
                  key={evt.event_id}
                  style={{
                    paddingLeft: '10px',
                    borderLeft: '2px solid #FF6500',
                    fontSize: '0.78rem',
                  }}
                >
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {evt.details}
                  </p>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '2px' }}>
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
