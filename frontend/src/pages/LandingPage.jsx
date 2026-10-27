import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Eye,
  CheckCircle,
  Sparkles,
  Zap,
  Lock,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { quickLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuickAccess = async (role) => {
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/40 text-xs font-semibold text-cyan-300 mb-8 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>We Code Coders Hackathon — Round 2 Build</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Evidence-First <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300">Brand Governance</span> Platform
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Pre-publication marketing content verification engine. Ground marketing drafts against versioned product specifications, detect factual contradictions and unbacked guarantees, and enforce reviewer accountability.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
              >
                Launch Brand Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800 transition-all"
              >
                Existing User Sign In
              </Link>
            </>
          )}
        </div>

        {/* 1-Click Evaluation Demo Accounts for Judges */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-indigo-900/50 bg-slate-900/60 backdrop-blur-xl p-6 text-left shadow-2xl mb-20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Hackathon Judge 1-Click Role Login
              </h2>
              <p className="text-xs text-slate-400">Select any pre-seeded persona to explore the verified end-to-end workflow:</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Demo Credentials
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Admin */}
            <button
              onClick={() => handleQuickAccess('admin')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/50 hover:border-purple-500 hover:bg-purple-950/20 text-left transition-all group"
            >
              <div className="text-xs font-bold text-purple-300 mb-1 flex items-center justify-between">
                <span>Brand Admin</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-400">Sarah Connor</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Manage guidelines & facts</div>
            </button>

            {/* Creator */}
            <button
              onClick={() => handleQuickAccess('creator')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/50 hover:border-cyan-500 hover:bg-cyan-950/20 text-left transition-all group"
            >
              <div className="text-xs font-bold text-cyan-300 mb-1 flex items-center justify-between">
                <span>Content Creator</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-400">Alex Rivera</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Submit drafts & PDF extraction</div>
            </button>

            {/* Reviewer */}
            <button
              onClick={() => handleQuickAccess('reviewer')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/50 hover:border-emerald-500 hover:bg-emerald-950/20 text-left transition-all group"
            >
              <div className="text-xs font-bold text-emerald-300 mb-1 flex items-center justify-between">
                <span>Compliance Reviewer</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-slate-400">Marcus Vance</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Audit citations & approvals</div>
            </button>
          </div>
        </div>

        {/* Section 7 Demonstration Showcase Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-left mb-20 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Scale className="h-4 w-4" />
            Mandatory Demonstration Engine (Section 7)
          </div>
          <h3 className="text-xl font-bold text-white mb-4">
            Example Wireless Headphones Verification Scenario
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <span className="text-slate-400 font-sans block mb-1 font-semibold">Approved Specification (SRC-FACT-001):</span>
              <span className="text-emerald-400">"Battery life: up to 12 hours under standard testing conditions."</span>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 border border-rose-900/60">
              <span className="text-slate-400 font-sans block mb-1 font-semibold">Submitted Marketing Copy:</span>
              <span className="text-rose-400">"Our headphones deliver guaranteed 24-hour battery life."</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block">Finding 1: Factual Contradiction</strong>
                <span className="text-slate-400">Draft claims 24 hours vs approved specification SRC-FACT-001 stating up to 12 hours.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block">Finding 2: Unsupported Guarantee</strong>
                <span className="text-slate-400">Absolute guarantee requires supporting evidence under FTC advertising substantiation guidelines.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-20">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Immutable Versioned Sources</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every guideline rule and product fact maintains an immutable version history (v1.0, v1.1). Source updates automatically trigger alerts on past content.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="h-10 w-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Hybrid Verification Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-accuracy deterministic numerical & terminology checks combined with server-side validated AI tone verification.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Enforced Reviewer Integrity</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict backend separation of duties: creators are blocked from self-approving, and approvals require recorded source snapshots.
            </p>
          </div>
        </div>

        {/* Round 3 Improvements Showcase */}
        <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-8 text-left">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            Round 3 MVP Improvements Included
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Advanced Governance Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="border-l-2 border-indigo-500 pl-4">
              <strong className="text-indigo-300 block mb-1">1. Source-Change Alerts</strong>
              <p className="text-slate-400">When an approved guideline is bumped to a new version, the engine flags historical drafts citing that source and requests re-review.</p>
            </div>
            <div className="border-l-2 border-cyan-500 pl-4">
              <strong className="text-cyan-300 block mb-1">2. Limited Image Review</strong>
              <p className="text-slate-400">Upload campaign visuals to verify brand color fidelity against approved palette with Delta-E distance and WCAG 2.2 AA contrast calculations.</p>
            </div>
            <div className="border-l-2 border-emerald-500 pl-4">
              <strong className="text-emerald-300 block mb-1">3. Revision Insights & Diff</strong>
              <p className="text-slate-400">Side-by-side text diff between revisions, tracking resolved issues versus newly introduced violations across the workspace.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
