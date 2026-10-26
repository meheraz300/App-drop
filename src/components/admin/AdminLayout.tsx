import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Grid,
  UploadCloud,
  History,
  BarChart3,
  HardDrive,
  FileText,
  Settings,
  ArrowLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { GlassSurface } from '../common/GlassComponents';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection }) => {
  const { currentRoute, navigateTo, user, signOut } = useApp();

  const navItems = [
    { route: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'admin-apps', label: 'Applications', icon: Grid },
    { route: 'admin-upload', label: 'Upload APK', icon: UploadCloud },
    { route: 'admin-versions', label: 'Versions & Rollback', icon: History },
    { route: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
    { route: 'admin-storage', label: 'Storage & Quota', icon: HardDrive },
    { route: 'admin-activity', label: 'Activity Logs', icon: FileText },
    { route: 'admin-settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-5rem)] py-4 px-4 sm:px-6 lg:px-8 gap-6 max-w-7xl mx-auto w-full">
      {/* Sidebar Navigation (B4 Glass Recipe) */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between">
        <GlassSurface variant="card" className="p-4 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Admin Header indicator */}
            <div className="p-3.5 rounded-[18px] bg-white/20 dark:bg-white/5 border border-white/30 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--lg-ink)]">
                <ShieldCheck className="h-4 w-4 text-[var(--lg-accent-start)]" />
                <span>Admin Console</span>
              </div>
              <div className="text-[11px] font-mono text-[var(--lg-ink-muted)] truncate font-medium">
                {user?.email || 'Administrator'}
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => navigateTo(item.route as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[9999px] text-xs font-semibold transition-all text-left glass-pressable ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] font-bold shadow-xs border border-white/40'
                        : 'text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/20 dark:border-white/10 space-y-2">
            <button
              onClick={() => navigateTo('home')}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[9999px] text-xs font-semibold text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] hover:bg-white/10 transition-colors glass-pressable"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Public Website</span>
            </button>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[9999px] text-xs font-semibold text-[var(--lg-error)] hover:bg-[var(--lg-error-bg)] transition-colors glass-pressable"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </GlassSurface>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Top contextual breadcrumb strip for admin */}
        <GlassSurface variant="floating" className="px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--lg-ink-muted)] font-medium">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span className="font-bold text-[var(--lg-ink)]">{activeSection}</span>
          </div>

          {/* Mobile navigation quick pills */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => navigateTo('admin-dashboard')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                currentRoute === 'admin-dashboard'
                  ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)]'
                  : 'text-[var(--lg-ink-muted)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => navigateTo('admin-apps')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                currentRoute === 'admin-apps'
                  ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)]'
                  : 'text-[var(--lg-ink-muted)]'
              }`}
            >
              Apps
            </button>
            <button
              onClick={() => navigateTo('admin-upload')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                currentRoute === 'admin-upload'
                  ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)]'
                  : 'text-[var(--lg-ink-muted)]'
              }`}
            >
              Upload
            </button>
          </div>
        </GlassSurface>

        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
};
