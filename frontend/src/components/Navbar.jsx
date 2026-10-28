import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Building2, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleRoleSwitch = async (role) => {
    setSwitching(true);
    setRoleMenuOpen(false);
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch (e) { console.error(e); } finally { setSwitching(false); }
  };

  const roleColors = {
    admin:    { dot: '#a78bfa', label: 'Admin' },
    creator:  { dot: '#FF8533', label: 'Creator' },
    reviewer: { dot: '#34d399', label: 'Reviewer' },
  };
  const currentRole = roleColors[user?.role] || { dot: '#888', label: user?.role };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50, width: '100%',
      background: 'rgba(10,10,10,0.9)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        display: 'flex', height: '64px', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 28px',
      }}>
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF6500, #FF9A00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255,101,0,0.4)', flexShrink: 0,
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                VeriBrand<span style={{ color: '#FF6500' }}>.AI</span>
              </span>
              <span className="badge-orange" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>MVP</span>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
              Evidence-First Brand Governance
            </p>
          </div>
        </Link>

        {/* Right */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
            }}>
              <Building2 size={13} color="#FF6500" />
              <span style={{ color: '#fff', fontWeight: 500 }}>{user?.workspace_name || 'Workspace'}</span>
            </div>

            {/* Role Switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setRoleMenuOpen(!roleMenuOpen)} disabled={switching} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 13px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
              }}>
                <Zap size={13} color="#FF6500" />
                <span style={{ color: currentRole.dot }}>{currentRole.label}</span>
                <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
              </button>
              {roleMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px', padding: '6px', minWidth: '155px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7)', zIndex: 100,
                }}>
                  {['admin','creator','reviewer'].map(r => (
                    <button key={r} onClick={() => handleRoleSwitch(r)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '10px', border: 'none',
                      background: user?.role === r ? 'rgba(255,101,0,0.1)' : 'transparent',
                      color: user?.role === r ? '#FF6500' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, textAlign: 'left',
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: roleColors[r]?.dot, flexShrink: 0 }} />
                      {roleColors[r]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{user?.full_name}</div>
                <div style={{ fontSize: '0.65rem', color: currentRole.dot, fontWeight: 500 }}>{user?.role?.toUpperCase()}</div>
              </div>
              <button onClick={logout} title="Sign out" style={{
                padding: '7px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex',
              }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Sign In</Link>
            <Link to="/register" className="btn-orange" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
}
