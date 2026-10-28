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
            <CheckSquare size={24} color="#34d399" />
            Compliance Reviewer Queue
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px' }}>
            Submissions awaiting evidence audit, contradiction resolution, or final publishing approval.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="btn-ghost"
          style={{ padding: '8px 12px' }}
          title="Refresh queue"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: filter === 'all' ? '1px solid #FF6500' : '1px solid rgba(255, 255, 255, 0.06)',
            background: filter === 'all' ? 'rgba(255, 101, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: filter === 'all' ? '#FF8533' : 'rgba(255, 255, 255, 0.6)',
          }}
        >
          All Pending ({pendingItems.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: filter === 'critical' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
            background: filter === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: filter === 'critical' ? '#f87171' : 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Critical Contradictions ({pendingItems.filter(i => i.critical_findings_count > 0).length})
        </button>
        <button
          onClick={() => setFilter('clean')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: filter === 'clean' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
            background: filter === 'clean' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: filter === 'clean' ? '#34d399' : 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Clean / Ready for Pass ({pendingItems.filter(i => i.total_findings === 0).length})
        </button>
      </div>

      {/* Queue Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Loading reviewer queue...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', margin: 0 }}>Review queue is empty</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              All submitted content in this workspace has been processed.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}>
                  <th style={{ padding: '14px 18px' }}>Draft Title & Product</th>
                  <th style={{ padding: '14px 18px' }}>Revision</th>
                  <th style={{ padding: '14px 18px' }}>Creator</th>
                  <th style={{ padding: '14px 18px' }}>Severity Breakdown</th>
                  <th style={{ padding: '14px 18px' }}>Submitted At</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr
                    key={item.draft_id}
                    style={{
                      borderBottom: idx < filteredItems.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 18px' }}>
                      <Link
                        to={`/drafts/${item.draft_id}`}
                        style={{
                          fontWeight: 700,
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.88rem',
                          display: 'block',
                          transition: 'color 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#FF8533'}
                        onMouseOut={e => e.currentTarget.style.color = '#fff'}
                      >
                        {item.title}
                      </Link>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px', display: 'block' }}>
                        Product: {item.target_product || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 18px', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Rev #{item.revision_number}
                    </td>
                    <td style={{ padding: '16px 18px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {item.creator_name}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {item.critical_findings_count > 0 && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <AlertOctagon size={11} />
                            {item.critical_findings_count} Critical
                          </span>
                        )}
                        {item.high_findings_count > 0 && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 101, 0, 0.12)',
                            border: '1px solid rgba(255, 101, 0, 0.3)',
                            color: '#FF8533',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <AlertTriangle size={11} />
                            {item.high_findings_count} High
                          </span>
                        )}
                        {item.total_findings === 0 && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}>
                            Clean (0 Issues)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                      {new Date(item.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <Link
                        to={`/drafts/${item.draft_id}`}
                        className="btn-orange"
                        style={{
                          padding: '7px 14px',
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                        }}
                      >
                        Audit & Decide <ArrowRight size={13} />
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
