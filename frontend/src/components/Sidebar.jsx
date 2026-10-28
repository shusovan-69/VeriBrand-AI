import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileEdit, CheckSquare,
  BookOpenCheck, History, GitCompare,
  Image as ImageIcon, Sparkles, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ pendingCount = 0 }) {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin','creator','reviewer','owner'] },
    { name: 'Submit Content', path: '/submit', icon: FileEdit, roles: ['creator','admin','owner'] },
    { name: 'Review Queue', path: '/reviews', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null, roles: ['reviewer','admin','owner'] },
    { name: 'Brand Guidelines', path: '/guidelines', icon: BookOpenCheck, roles: ['admin','reviewer','creator','owner'] },
    { name: 'Revision Insights', path: '/insights', icon: GitCompare, tag: 'AI', roles: ['admin','reviewer','creator','owner'] },
    { name: 'Image Review', path: '/image-review', icon: ImageIcon, tag: 'AI', roles: ['admin','reviewer','creator','owner'] },
    { name: 'Activity Log', path: '/activity', icon: History, roles: ['admin','reviewer','creator','owner'] },
  ];

  const filtered = navItems.filter(item => !user || item.roles.includes(user.role));

  const roleInfo = {
    admin:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    creator:  { color: '#FF8533', bg: 'rgba(255,133,51,0.1)' },
    reviewer: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  };
  const ri = roleInfo[user?.role] || { color: '#888', bg: 'rgba(136,136,136,0.1)' };

  return (
    <aside style={{
      width: '240px', flexShrink: 0,
      background: '#0d0d0d',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      padding: '24px 12px',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 'calc(100vh - 64px)',
    }}>
      <div>
        <p className="section-label" style={{ padding: '0 10px', marginBottom: '10px' }}>Navigation</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {filtered.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={{ justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} />
                  {item.name}
                </span>
                {item.badge && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px',
                    background: 'rgba(255,101,0,0.15)', color: '#FF8533',
                    border: '1px solid rgba(255,101,0,0.3)',
                    fontSize: '0.65rem', fontWeight: 700,
                  }}>{item.badge}</span>
                )}
                {item.tag && !item.badge && (
                  <span style={{
                    padding: '2px 7px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.6rem', fontWeight: 600,
                  }}>{item.tag}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Info Card */}
        <div style={{
          marginTop: '24px', padding: '14px 14px',
          borderRadius: '14px',
          background: 'rgba(255,101,0,0.06)',
          border: '1px solid rgba(255,101,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
            <Sparkles size={13} color="#FF6500" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FF8533' }}>Brand Intelligence Core</span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Evidence-first brand verification with immutable revisions & source citations.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 14px', borderRadius: '14px',
        background: ri.bg,
        border: `1px solid ${ri.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>Current Role</p>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: ri.color, textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: ri.color, boxShadow: `0 0 8px ${ri.color}`,
        }} />
      </div>
    </aside>
  );
}
