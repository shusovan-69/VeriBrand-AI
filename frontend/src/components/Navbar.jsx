import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, CheckCircle2, User, LogOut, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  const handleRoleSwitch = async (role) => {
    setSwitching(true);
    try {
      await quickLogin(role);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
      case 'reviewer':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';
      case 'creator':
        return 'bg-cyan-900/60 text-cyan-300 border-cyan-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Shield className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">
                  VeriBrand<span className="text-cyan-400">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Evidence-First Brand Governance</p>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Active Workspace */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-medium text-slate-200">{user?.workspace_name || "Workspace"}</span>
            </div>

            {/* Hackathon Judge Role Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 py-0.5 text-[11px] font-medium hidden lg:inline">Switch Role:</span>
              <button
                onClick={() => handleRoleSwitch('admin')}
                disabled={switching || user?.role === 'admin'}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  user?.role === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Switch to Admin role"
              >
                Admin
              </button>
              <button
                onClick={() => handleRoleSwitch('creator')}
                disabled={switching || user?.role === 'creator'}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  user?.role === 'creator'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Switch to Creator role"
              >
                Creator
              </button>
              <button
                onClick={() => handleRoleSwitch('reviewer')}
                disabled={switching || user?.role === 'reviewer'}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  user?.role === 'reviewer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Switch to Reviewer role"
              >
                Reviewer
              </button>
            </div>

            {/* User Profile & Role */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200">{user?.full_name}</div>
                <div className="flex justify-end">
                  <span className={`inline-block px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${getRoleBadge(user?.role)}`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
