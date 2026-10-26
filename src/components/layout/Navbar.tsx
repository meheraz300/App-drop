import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Moon,
  Sun,
  ShieldCheck,
  Search,
  LogOut,
} from 'lucide-react';
import { GlassIconButton } from '../common/GlassComponents';

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentRoute,
    navigateTo,
    searchQuery,
    setSearchQuery,
    isAdmin,
    signOut,
  } = useApp();

  const isPublicRoute = ![
    'admin-dashboard',
    'admin-apps',
    'admin-upload',
    'admin-versions',
    'admin-analytics',
    'admin-storage',
    'admin-activity',
    'admin-settings',
  ].includes(currentRoute);

  return (
    <header className="sticky top-3 z-40 w-full px-4 sm:px-6 lg:px-8 transition-all">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Primary Navigation"
          className="glass-surface-floating rounded-[9999px] h-16 sm:h-[72px] px-4 sm:px-6 flex items-center justify-between gap-4"
        >
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity glass-pressable"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-sm border border-white/40">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--lg-ink)]">
                AppDrop
              </span>
              <span className="text-[10px] font-medium text-[var(--lg-ink-muted)] -mt-1 hidden sm:block">
                Liquid Glass Hub
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-[var(--lg-ink-muted)]">
            <button
              onClick={() => navigateTo('home')}
              className={`px-4 py-2 rounded-full transition-all glass-pressable ${
                currentRoute === 'home'
                  ? 'bg-white/30 dark:bg-white/10 text-[var(--lg-ink)] font-bold shadow-xs border border-white/40'
                  : 'hover:text-[var(--lg-ink)] hover:bg-white/10'
              }`}
            >
              Explore Apps
            </button>
            <button
              onClick={() => navigateTo('categories', null, 'Tools')}
              className={`px-4 py-2 rounded-full transition-all glass-pressable ${
                currentRoute === 'categories'
                  ? 'bg-white/30 dark:bg-white/10 text-[var(--lg-ink)] font-bold shadow-xs border border-white/40'
                  : 'hover:text-[var(--lg-ink)] hover:bg-white/10'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => navigateTo('about')}
              className={`px-4 py-2 rounded-full transition-all glass-pressable ${
                currentRoute === 'about'
                  ? 'bg-white/30 dark:bg-white/10 text-[var(--lg-ink)] font-bold shadow-xs border border-white/40'
                  : 'hover:text-[var(--lg-ink)] hover:bg-white/10'
              }`}
            >
              About Hub
            </button>
            {isAdmin && (
              <button
                onClick={() => navigateTo('admin-dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all glass-pressable ${
                  !isPublicRoute
                    ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] font-bold shadow-sm'
                    : 'text-[var(--lg-accent-start)] hover:bg-white/10 font-bold'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>

          {/* Zone 3: Search & Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {isPublicRoute && (
              <div className="relative hidden lg:block w-56 xl:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lg-ink-muted)]" />
                <input
                  type="text"
                  placeholder="Search APKs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentRoute !== 'home' && currentRoute !== 'categories') {
                      navigateTo('home');
                    }
                  }}
                  className="w-full h-11 pl-10 pr-4 text-xs rounded-full glass-surface text-[var(--lg-ink)] placeholder-[var(--lg-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lg-accent-start)] border border-white/30 transition-all shadow-xs"
                />
              </div>
            )}

            {/* Theme Toggle Button */}
            <GlassIconButton
              label="Toggle visual theme"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </GlassIconButton>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('admin-dashboard')}
                  className="hidden sm:inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] text-xs font-bold shadow-xs border border-white/40 glass-pressable"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </button>
                <GlassIconButton
                  label="Sign out of Admin session"
                  onClick={signOut}
                  className="hover:text-red-600 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4" />
                </GlassIconButton>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
