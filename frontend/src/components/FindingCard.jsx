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
    <div style={{
      background: isResolved ? 'rgba(18, 18, 18, 0.6)' : isCritical ? 'rgba(26, 14, 14, 0.85)' : '#161616',
      border: isResolved ? '1px solid rgba(255, 255, 255, 0.04)' : isCritical ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: isCritical && !isResolved ? '0 0 24px rgba(239, 68, 68, 0.08)' : 'none',
      opacity: isResolved ? 0.6 : 1,
      transition: 'all 0.25s ease',
    }}>
      {/* Top Header: Category, Severity, and Evidence Status */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CategoryBadge category={finding.category} />
          <SeverityBadge severity={finding.severity} />
        </div>
        <EvidenceStatusBadge status={finding.evidence_status} />
      </div>

      {/* Flagged Draft Snippet */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '14px',
      }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
          Draft Claim / Excerpt Flagged:
        </p>
        <span style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
        }}>
          "{finding.original_text}"
        </span>
      </div>

      {/* Explanation */}
      <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.6', marginBottom: '16px' }}>
        {finding.explanation}
      </p>

      {/* Grounded Evidence Citation */}
      {finding.source_id ? (
        <div style={{
          background: 'rgba(255, 101, 0, 0.04)',
          border: '1px solid rgba(255, 101, 0, 0.18)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '14px',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FF8533', fontWeight: 600, marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} color="#FF6500" />
              <span>Grounded Approved Citation:</span>
            </div>
            <span style={{
              fontFamily: 'monospace',
              background: 'rgba(255, 101, 0, 0.12)',
              color: '#FF8533',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 101, 0, 0.25)',
              fontSize: '0.72rem',
            }}>
              {finding.source_id} ({finding.source_version || 'v1.0'})
            </span>
          </div>
          {finding.source_excerpt && (
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic',
              borderLeft: '2px solid #FF6500',
              paddingLeft: '10px',
              margin: '6px 0 0 0',
              fontSize: '0.8rem',
            }}>
              "{finding.source_excerpt}"
            </p>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontSize: '0.78rem',
          color: '#fcd34d',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FileQuestion size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>No supporting approved specification found in workspace sources.</span>
        </div>
      )}

      {/* Suggested Intent-Preserving Revision */}
      {finding.suggested_revision && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#34d399',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Sparkles size={12} color="#34d399" />
              Suggested Intent-Preserving Revision
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleCopySuggestion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.72rem',
                  color: '#6ee7b7',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
                title="Copy suggestion to clipboard"
              >
                {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(finding.original_text, finding.suggested_revision)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    padding: '3px 9px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <ArrowRight size={12} />
                  Apply
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#a7f3d0', margin: 0 }}>
            {finding.suggested_revision}
          </p>
        </div>
      )}

      {/* Resolution Checkbox */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.78rem',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', color: 'rgba(255,255,255,0.5)' }}>
          <input
            type="checkbox"
            checked={isResolved}
            onChange={handleToggleResolve}
            disabled={resolving}
            style={{
              accentColor: '#FF6500',
              cursor: 'pointer',
              width: '15px',
              height: '15px',
            }}
          />
          <span>{isResolved ? 'Marked as Resolved' : 'Mark issue as resolved'}</span>
        </label>
        {isResolved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            Addressed
          </span>
        )}
      </div>
    </div>
  );
}
