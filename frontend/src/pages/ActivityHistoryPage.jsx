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

  const getActionBadgeStyle = (action) => {
    switch (action) {
      case 'draft_approved':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', color: '#34d399' };
      case 'changes_requested':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', color: '#f87171' };
      case 'verification_completed':
        return { bg: 'rgba(255, 101, 0, 0.12)', border: 'rgba(255, 101, 0, 0.3)', color: '#FF8533' };
      case 'draft_submitted':
      case 'revision_submitted':
        return { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' };
      case 'guideline_updated':
      case 'approved_fact_updated':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)' };
    }
  };

  const filteredEvents = events.filter((e) =>
    e.details.toLowerCase().includes(search.toLowerCase()) ||
    e.actor_name.toLowerCase().includes(search.toLowerCase()) ||
    e.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <History size={24} color="#FF6500" />
            Workspace Audit Trail & Activity Log
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px' }}>
            Immutable log of all user registrations, content submissions, verification runs, and reviewer decisions.
          </p>
        </div>

        <button
          onClick={fetchActivity}
          disabled={loading}
          className="btn-ghost"
          style={{ padding: '8px 12px' }}
          title="Refresh audit events"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by actor or description..."
          className="input-dark"
          style={{ paddingLeft: '36px', fontSize: '0.8rem', padding: '9px 12px 9px 36px' }}
        />
      </div>

      {/* Events Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Loading audit events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            No events found matching your query.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEvents.map((evt, idx) => {
              const bStyle = getActionBadgeStyle(evt.action);
              return (
                <div
                  key={evt.event_id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: idx < filteredEvents.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                    gap: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: bStyle.bg,
                        border: `1px solid ${bStyle.border}`,
                        color: bStyle.color,
                      }}>
                        {evt.action.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>by</span>
                      <strong style={{ fontSize: '0.78rem', color: '#fff' }}>{evt.actor_name}</strong>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', margin: 0, lineHeight: '1.4' }}>
                      {evt.details}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.4)' }}>
                      {new Date(evt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.25)', marginTop: '2px' }}>
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
