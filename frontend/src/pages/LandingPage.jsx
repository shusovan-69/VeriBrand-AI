import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Lock, ArrowRight, Zap, Scale, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { quickLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuickAccess = async (role) => {
    try { await quickLogin(role); navigate('/dashboard'); }
    catch (err) { console.error('Quick login failed:', err); }
  };

  const features = [
    { icon: ShieldCheck, title: 'Immutable Versioned Sources', desc: 'Every guideline and product fact maintains version history. Source updates automatically trigger alerts on past content.', color: '#a78bfa' },
    { icon: Cpu, title: 'Hybrid Verification Engine', desc: 'High-accuracy deterministic numerical checks combined with server-side AI tone verification.', color: '#FF6500' },
    { icon: Lock, title: 'Enforced Reviewer Integrity', desc: 'Strict backend separation: creators cannot self-approve. All approvals require recorded source snapshots.', color: '#34d399' },
  ];

  const roles = [
    { key: 'admin', label: 'Brand Admin', name: 'Sarah Connor', desc: 'Manage guidelines & facts', color: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
    { key: 'creator', label: 'Content Creator', name: 'Alex Rivera', desc: 'Submit drafts & PDF extraction', color: '#FF8533', border: 'rgba(255,133,51,0.2)' },
    { key: 'reviewer', label: 'Compliance Reviewer', name: 'Marcus Vance', desc: 'Audit citations & approvals', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '-100px', left: '10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,101,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,180,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '80px 0 60px', position: 'relative', zIndex: 1 }}>
          <div className="badge-orange animate-fade-up" style={{ marginBottom: '24px', display: 'inline-flex' }}>
            <Zap size={12} />
            Enterprise Brand Governance Platform
          </div>

          <h1 className="animate-fade-up delay-100" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px', color: '#fff' }}>
            Evidence-First{' '}
            <span className="gradient-text">Brand Governance</span>
            {' '}Platform
          </h1>

          <p className="animate-fade-up delay-200" style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.5)', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            Pre-publication marketing content verification engine. Ground drafts against versioned product specs, detect factual contradictions, and enforce reviewer accountability.
          </p>

          <div className="animate-fade-up delay-300" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-orange" style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-orange" style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
                  Launch Brand Workspace <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn-ghost" style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Quick Login Card */}
        <div className="card animate-fade-up delay-400" style={{ padding: '28px', marginBottom: '56px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#FF6500" /> Instant Role Preview
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                Select a role persona to explore the end-to-end governance workflow
              </p>
            </div>
            <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace' }}>
              Role Presets
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {roles.map(r => (
              <button key={r.key} onClick={() => handleQuickAccess(r.key)} style={{
                padding: '16px', borderRadius: '16px', border: `1px solid ${r.border}`,
                background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = `rgba(${r.key === 'admin' ? '167,139,250' : r.key === 'creator' ? '255,101,0' : '52,211,153'},0.07)`; e.currentTarget.style.borderColor = r.color + '55'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = r.border; }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: r.color, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {r.label} <ArrowRight size={13} color={r.color} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{r.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontFamily: 'monospace' }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Scenario */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="badge-orange" style={{ marginBottom: '12px', display: 'inline-flex' }}>
              <Scale size={11} /> Live Verification Simulation
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Wireless Headphones Verification Scenario</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Approved Specification (SRC-FACT-001)</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', lineHeight: 1.6 }}>"Battery life: up to 12 hours under standard testing conditions."</p>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fca5a5', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✗ Submitted Marketing Copy</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', lineHeight: 1.6 }}>"Our headphones deliver guaranteed 24-hour battery life."</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { icon: AlertTriangle, color: '#fca5a5', bg: 'rgba(239,68,68,0.05)', title: 'Finding 1: Factual Contradiction', desc: 'Draft claims 24 hours vs approved specification SRC-FACT-001 stating up to 12 hours.' },
              { icon: AlertTriangle, color: '#FCD34D', bg: 'rgba(252,211,77,0.05)', title: 'Finding 2: Unsupported Guarantee', desc: 'Absolute guarantee requires supporting evidence under FTC advertising substantiation guidelines.' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: '14px', background: f.bg, border: `1px solid ${f.color}22`, display: 'flex', gap: '12px' }}>
                <f.icon size={16} color={f.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{f.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Powerful Features</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Everything you need for evidence-first brand governance</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: '28px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: `${f.color}18`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* R3 Improvements */}
        <div className="card" style={{ padding: '36px', marginBottom: '60px', background: 'linear-gradient(135deg, rgba(255,101,0,0.05) 0%, rgba(10,10,10,0) 100%)' }}>
          <span className="badge-orange" style={{ marginBottom: '14px', display: 'inline-flex' }}>
            <Sparkles size={11} /> Advanced Governance
          </span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>Advanced Governance Modules</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { color: '#a78bfa', num: '1', title: 'Source-Change Alerts', desc: 'When an approved guideline bumps versions, the engine flags historical drafts and requests re-review.' },
              { color: '#FF6500', num: '2', title: 'Visual Brand Asset Review', desc: 'Verify brand color fidelity against approved palette with Delta-E distance and WCAG 2.2 AA contrast.' },
              { color: '#34d399', num: '3', title: 'Revision Insights & Diff', desc: 'Side-by-side text diff between revisions, tracking resolved issues vs new violations.' },
            ].map(item => (
              <div key={item.num} style={{ borderLeft: `2px solid ${item.color}`, paddingLeft: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: item.color, fontFamily: 'monospace', background: `${item.color}18`, padding: '2px 7px', borderRadius: '6px' }}>0{item.num}</span>
                  <strong style={{ fontSize: '0.85rem', color: item.color }}>{item.title}</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
