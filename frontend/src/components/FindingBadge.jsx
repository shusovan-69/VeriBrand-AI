import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'medium').toLowerCase();
  
  const styles = {
    critical: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      color: '#fca5a5',
      icon: <AlertOctagon size={12} color="#f87171" style={{ flexShrink: 0 }} />,
      label: 'Critical'
    },
    high: {
      bg: 'rgba(255, 101, 0, 0.14)',
      border: '1px solid rgba(255, 101, 0, 0.35)',
      color: '#FF8533',
      icon: <AlertTriangle size={12} color="#FF8533" style={{ flexShrink: 0 }} />,
      label: 'High'
    },
    medium: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      color: '#fcd34d',
      icon: <AlertTriangle size={12} color="#fbbf24" style={{ flexShrink: 0 }} />,
      label: 'Medium'
    },
    low: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      color: '#67e8f9',
      icon: <Info size={12} color="#38bdf8" style={{ flexShrink: 0 }} />,
      label: 'Low'
    },
    default: {
      bg: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.6)',
      icon: <Info size={12} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />,
      label: 'Info'
    }
  };

  const current = styles[sev] || styles.default;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: current.bg,
      border: current.border,
      color: current.color,
    }}>
      {current.icon}
      {current.label}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const cat = (category || 'unsupported_claim').toLowerCase();

  const map = {
    contradiction: { label: 'Factual Contradiction', color: '#f87171', bg: 'rgba(239, 68, 68, 0.1)' },
    guideline_violation: { label: 'Guideline Violation', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
    unsupported_claim: { label: 'Unsupported Claim', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
    tone_issue: { label: 'Tone & Style', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
    accessibility_prompt: { label: 'Accessibility Prompt', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.1)' },
  };

  const item = map[cat] || { label: category, color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: '8px',
      fontSize: '0.72rem',
      fontWeight: 600,
      background: item.bg,
      border: `1px solid ${item.color}30`,
      color: item.color,
    }}>
      {item.label}
    </span>
  );
}

export function EvidenceStatusBadge({ status }) {
  const st = (status || 'insufficient_evidence').toLowerCase();

  const map = {
    contradicted: {
      icon: <AlertOctagon size={13} color="#f87171" />,
      label: 'Contradicted by Approved Evidence',
      color: '#fca5a5',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    supported: {
      icon: <CheckCircle size={13} color="#34d399" />,
      label: 'Supported by Approved Evidence',
      color: '#6ee7b7',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    insufficient_evidence: {
      icon: <HelpCircle size={13} color="#FF8533" />,
      label: 'Insufficient Approved Evidence',
      color: '#FF8533',
      bg: 'rgba(255, 101, 0, 0.12)',
      border: 'rgba(255, 101, 0, 0.3)',
    },
    guideline_violation: {
      icon: <ShieldAlert size={13} color="#c084fc" />,
      label: 'Brand Guideline Violation',
      color: '#d8b4fe',
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.3)',
    },
  };

  const item = map[st] || {
    icon: <Info size={13} color="rgba(255,255,255,0.6)" />,
    label: 'Needs Human Judgment',
    color: 'rgba(255,255,255,0.7)',
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '10px',
      fontSize: '0.72rem',
      fontWeight: 600,
      background: item.bg,
      border: `1px solid ${item.border}`,
      color: item.color,
    }}>
      {item.icon}
      {item.label}
    </span>
  );
}
