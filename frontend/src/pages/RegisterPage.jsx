import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Building2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('creator');
  const [workspaceName, setWorkspaceName] = useState('Acme Brand Governance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        workspace_name: workspaceName,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'creator', label: 'Creator', desc: 'Draft campaigns & verify claims', color: '#FF8533' },
    { key: 'reviewer', label: 'Reviewer', desc: 'Audit evidence & approve drafts', color: '#34d399' },
    { key: 'admin', label: 'Admin', desc: 'Set guidelines & ground truth', color: '#a78bfa' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-200px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,101,0,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Brand Header */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '28px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FF6500, #FF9A00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(255,101,0,0.4)',
        }}>
          <Shield size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
          VeriBrand<span style={{ color: '#FF6500' }}>.AI</span>
        </span>
      </Link>

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Register Brand Workspace
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            Setup an isolated workspace with AI-verified brand governance
          </p>
        </div>

        <div className="card" style={{ padding: '30px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} color="#fca5a5" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '0.82rem', color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="input-dark"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="input-dark"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-dark"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Assign Initial Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {roles.map((r) => {
                  const isSel = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: isSel ? `1px solid ${r.color}` : '1px solid rgba(255,255,255,0.06)',
                        background: isSel ? `${r.color}15` : 'rgba(255,255,255,0.02)',
                        color: isSel ? r.color : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{r.label}</span>
                      <span style={{ fontSize: '0.62rem', color: isSel ? r.color : 'rgba(255,255,255,0.3)', lineHeight: '1.2' }}>
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '7px' }}>
                Workspace Brand Name
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Audio and Tech"
                  className="input-dark"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-orange"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  Register & Open Workspace <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '22px' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#FF8533', fontWeight: 600, textDecoration: 'none' }}>
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
