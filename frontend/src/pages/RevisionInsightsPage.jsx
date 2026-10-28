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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FF8533', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          <Sparkles size={13} color="#FF6500" />
          Intelligence Suite: Revision Analytics & Source Alerts
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <GitCompare size={24} color="#FF6500" />
          Revision Analytics & Source Alerts
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '6px' }}>
          Compare revisions side-by-side, observe resolved vs introduced issues, and audit source-change re-review triggers.
        </p>
      </div>

      {/* Source-Change Alerts Section */}
      {alerts.length > 0 && (
        <div style={{
          background: 'rgba(255, 101, 0, 0.07)',
          border: '1px solid rgba(255, 101, 0, 0.25)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FF8533', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
            <ShieldAlert size={18} color="#FF8533" />
            Active Source-Change Re-Review Alerts ({alerts.length})
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            The following drafts cited a source version that has since been updated by administrators. Historical decisions remain recorded, but re-evaluation is advised:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {alerts.map((alt) => (
              <div key={alt._id || alt.alert_id} style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#161616',
                border: '1px solid rgba(255, 101, 0, 0.2)',
                fontSize: '0.8rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#FF8533', fontWeight: 700 }}>{alt.source_id}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255, 101, 0, 0.12)',
                    color: '#FF8533',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 101, 0, 0.25)',
                    fontFamily: 'monospace',
                  }}>
                    {alt.old_version} → {alt.new_version}
                  </span>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', margin: '0 0 12px 0', lineHeight: '1.4' }}>{alt.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>Draft: {alt.draft_id}</span>
                  <Link
                    to={`/drafts/${alt.draft_id}`}
                    style={{ fontSize: '0.75rem', color: '#FF8533', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Audit Draft <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Revision Difference Comparison Controls */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <GitCompare size={18} color="#FF6500" />
          Cross-Revision Difference Comparison
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.8rem' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Select Marketing Draft</label>
            <select
              value={selectedDraftId}
              onChange={(e) => setSelectedDraftId(e.target.value)}
              className="input-dark"
              style={{ cursor: 'pointer' }}
            >
              {drafts.map((d) => (
                <option key={d.draft_id} value={d.draft_id} style={{ background: '#161616', color: '#fff' }}>
                  {d.title} ({d.draft_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Base Revision (Before)</label>
            <select
              value={baseRev}
              onChange={(e) => setBaseRev(e.target.value)}
              className="input-dark"
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
            >
              {revisions.map((r) => (
                <option key={r.revision_id} value={r.revision_id} style={{ background: '#161616', color: '#fff' }}>
                  Revision #{r.revision_number} ({r.revision_id.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>New Revision (After)</label>
            <select
              value={newRev}
              onChange={(e) => setNewRev(e.target.value)}
              className="input-dark"
              style={{ cursor: 'pointer', fontFamily: 'monospace' }}
            >
              {revisions.map((r) => (
                <option key={r.revision_id} value={r.revision_id} style={{ background: '#161616', color: '#fff' }}>
                  Revision #{r.revision_number} ({r.revision_id.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Output */}
        {loadingDiff ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Computing revision delta...
          </div>
        ) : diffData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            {/* Diff Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', textAlign: 'center', fontFamily: 'monospace' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{diffData.resolved_count}</div>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Issues Resolved</span>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{diffData.new_issues_count}</div>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>New Issues Introduced</span>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{diffData.persistent_count}</div>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Unresolved Issues</span>
              </div>
            </div>

            {/* Unified Line Diff */}
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>Unified Text Changes:</p>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#0d0d0d',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: '1.6',
                overflowX: 'auto',
              }}>
                {diffData.text_diff && diffData.text_diff.length > 0 ? (
                  diffData.text_diff.map((line, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: line.startsWith('+') ? 'rgba(16, 185, 129, 0.15)' : line.startsWith('-') ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: line.startsWith('+') ? '#34d399' : line.startsWith('-') ? '#f87171' : line.startsWith('@') ? '#FF8533' : 'rgba(255, 255, 255, 0.6)',
                        fontWeight: line.startsWith('@') ? 700 : 400,
                      }}
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>No textual differences between selected revisions.</span>
                )}
              </div>
            </div>

            {/* Resolved Findings */}
            {diffData.resolved_issues?.length > 0 && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.8rem',
              }}>
                <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle size={15} />
                  Successfully Corrected in New Revision:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                  {diffData.resolved_issues.map((iss, i) => (
                    <li key={i}>
                      <span style={{ fontFamily: 'monospace', color: '#f87171' }}>"{iss.original_text}"</span>: {iss.explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Violation Trends */}
      {trends && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <BarChart3 size={18} color="#FF6500" />
                Workspace Violation Trends & Recurring Mistakes
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                Aggregate statistics from all historical analysis runs across the workspace.
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.5)' }}>
              Total Recorded Violations: <strong style={{ color: '#FF8533' }}>{trends.total_violations_recorded}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '0.8rem' }}>
            {/* Top Violated Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>Top Violated Source Rules:</span>
              {trends.top_violated_rules?.length === 0 ? (
                <div style={{ color: 'rgba(255, 255, 255, 0.35)' }}>No violations recorded yet.</div>
              ) : (
                trends.top_violated_rules.map((rule) => (
                  <div key={rule.rule_id} style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontFamily: 'monospace', color: '#FF8533', fontWeight: 600 }}>{rule.rule_id}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#161616',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                    }}>
                      {rule.count} breach{rule.count > 1 ? 'es' : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Top Flagged Phrases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>Most Frequently Flagged Claims:</span>
              {trends.top_flagged_phrases?.length === 0 ? (
                <div style={{ color: 'rgba(255, 255, 255, 0.35)' }}>No claims flagged yet.</div>
              ) : (
                trends.top_flagged_phrases.map((phrase, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontFamily: 'monospace', color: '#f87171', fontWeight: 600 }}>"{phrase.phrase}"</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#161616',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                    }}>
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
