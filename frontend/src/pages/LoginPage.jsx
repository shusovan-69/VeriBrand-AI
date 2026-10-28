import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get('expired') ? 'Your session expired. Please log in again.' : '');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.detail || 'Failed to authenticate. Please check your credentials.'); }
    finally { setLoading(false); }
  };

  const handleQuick = async (role) => {
    setLoading(true); setError('');
    try { await quickLogin(role); navigate('/dashboard'); }
    catch (err) { setError('Quick login failed.'); }
    finally { setLoading(false); }
  };

  const quickRoles = [
    { key: 'admin',    label: 'Admin',    color: '#a78bfa' },
    { key: 'creator',  label: 'Creator',  color: '#FF8533' },
    { key: 'reviewer', label: 'Reviewer', color: '#34d399' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Orb */}
      <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,101,0,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF6500, #FF9A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,101,0,0.4)' }}>
          <Shield size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>VeriBrand<span style={{ color: '#FF6500' }}>.AI</span></span>
      </Link>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Sign in to your workspace</h1>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Enter your credentials or select a quick preview persona</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '20px' }}>
              <AlertCircle size={15} color="#fca5a5" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          {/* Quick Login */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <Zap size={13} color="#FF6500" />
              <span className="section-label">Instant Role Preview</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {quickRoles.map(r => (
                <button key={r.key} type="button" onClick={() => handleQuick(r.key)} style={{
                  padding: '9px 6px', borderRadius: '10px', border: `1px solid ${r.color}30`,
                  background: `${r.color}0a`, color: r.color, fontWeight: 600,
                  fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = `${r.color}18`; }}
                onMouseOut={e => { e.currentTarget.style.background = `${r.color}0a`; }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@veribrand.ai" className="input-dark" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="input-dark" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-orange" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
              {loading ? (
                <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '20px' }}>
            Don''t have an account?{' '}
            <Link to="/register" style={{ color: '#FF8533', fontWeight: 600, textDecoration: 'none' }}>Create workspace</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
