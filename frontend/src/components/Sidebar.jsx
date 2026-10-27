import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
  CheckSquare,
  BookOpenCheck,
  History,
  GitCompare,
  Image as ImageIcon,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ pendingCount = 0, alertsCount = 0 }) {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Overview Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'creator', 'reviewer', 'owner']
    },
    {
      name: 'Submit Content',
      path: '/submit',
      icon: FileEdit,
      roles: ['creator', 'admin', 'owner']
    },
    {
      name: 'Review Queue',
      path: '/reviews',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
      roles: ['reviewer', 'admin', 'owner']
    },
    {
      name: 'Brand Guidelines & Facts',
      path: '/guidelines',
      icon: BookOpenCheck,
      roles: ['admin', 'reviewer', 'creator', 'owner']
    },
    {
      name: 'Revision Insights',
      path: '/insights',
      icon: GitCompare,
      roles: ['admin', 'reviewer', 'creator', 'owner'],
      highlight: true
    },
    {
      name: 'Image Brand Review',
      path: '/image-review',
      icon: ImageIcon,
      roles: ['admin', 'reviewer', 'creator', 'owner'],
      highlight: true
    },
    {
      name: 'Activity & Audit Log',
      path: '/activity',
      icon: History,
      roles: ['admin', 'reviewer', 'creator', 'owner']
    }
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-slate-800/80 bg-slate-950/60 p-4">
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-6">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Workspace Navigation
            </p>
            <nav className="space-y-1">
              {navItems
                .filter(item => !user || item.roles.includes(user.role))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-900/60 to-slate-900 text-cyan-300 border border-indigo-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          R3
                        </span>
                      )}
                    </NavLink>
                  );
                })}
            </nav>
          </div>

          {/* Demonstration Notice Card */}
          <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Round 2 Evaluation
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Evidence-first brand verification engine with immutable revisions, source citations, and human reviewer approvals.
            </p>
          </div>
        </div>

        {/* User Workspace Info Footer */}
        <div className="pt-4 border-t border-slate-900">
          <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Role: <strong className="text-slate-200 capitalize">{user?.role}</strong></span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
        </div>
      </div>
    </aside>
  );
}
