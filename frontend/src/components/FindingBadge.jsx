import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'medium').toLowerCase();
  switch (sev) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/60 shadow-sm shadow-rose-900/40">
          <AlertOctagon className="h-3 w-3 text-rose-400" />
          Critical
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/50">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-950/60 text-yellow-300 border border-yellow-600/40">
          Medium
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-600/40">
          Low
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Info className="h-3 w-3 text-slate-400" />
          Info
        </span>
      );
  }
}

export function CategoryBadge({ category }) {
  const cat = (category || 'unsupported_claim').toLowerCase();
  switch (cat) {
    case 'contradiction':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-900/40 text-red-300 border border-red-700/50">
          Factual Contradiction
        </span>
      );
    case 'guideline_violation':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/50">
          Guideline Violation
        </span>
      );
    case 'unsupported_claim':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50">
          Unsupported Claim
        </span>
      );
    case 'tone_issue':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
          Tone & Style
        </span>
      );
    case 'accessibility_prompt':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
          Accessibility Prompt
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {category}
        </span>
      );
  }
}

export function EvidenceStatusBadge({ status }) {
  const st = (status || 'insufficient_evidence').toLowerCase();
  switch (st) {
    case 'contradicted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-sm">
          <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
          Contradicted by Approved Evidence
        </span>
      );
    case 'supported':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          Supported by Approved Evidence
        </span>
      );
    case 'insufficient_evidence':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-950/80 text-orange-300 border border-orange-600/50">
          <HelpCircle className="h-3.5 w-3.5 text-orange-400" />
          Insufficient Approved Evidence
        </span>
      );
    case 'guideline_violation':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-600/50">
          <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
          Brand Guideline Violation
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-700">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          Needs Human Judgment
        </span>
      );
  }
}
