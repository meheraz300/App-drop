import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppCard } from './AppCard';
import {
  Search,
  SlidersHorizontal,
  X,
  UploadCloud,
  Sparkles,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { computeDownloadAggregates } from '../../lib/analyticsTracker';
import {
  GlassSurface,
  GlassChip,
  GlassButton,
  GlassIconButton,
  GlassToggle,
} from '../common/GlassComponents';

const CATEGORIES = [
  'All',
  'Tools',
  'Productivity',
  'Personalization',
  'Media & Audio',
  'Utilities',
];

export const HomeView: React.FC = () => {
  const {
    apps,
    versions,
    downloadStats,
    searchQuery,
    setSearchQuery,
    navigateTo,
    isAdmin,
    user,
    theme,
    toggleTheme,
    isInitialSyncLoading,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'downloads' | 'name'>('updated');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [checksumVerification, setChecksumVerification] = useState(true);
  const [updateAlerts, setUpdateAlerts] = useState(true);

  const aggregates = useMemo(() => computeDownloadAggregates(downloadStats), [downloadStats]);

  // Public visitors see published and public apps
  const publicApps = useMemo(() => {
    return apps.filter((a) => a.visibility === 'public' && a.status === 'published');
  }, [apps]);

  // Filtered & Sorted apps
  const filteredApps = useMemo(() => {
    let result = publicApps;

    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.packageName.toLowerCase().includes(q) ||
          a.shortDescription.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'downloads') {
        const dA = aggregates.byApp[a.id] || 0;
        const dB = aggregates.byApp[b.id] || 0;
        return dB - dA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [publicApps, selectedCategory, searchQuery, sortBy, aggregates.byApp]);

  const userName = user?.email ? user.email.split('@')[0] : 'Explorer';

  return (
    <div className="space-y-6 sm:space-y-8 py-6 sm:py-8 max-w-4xl mx-auto">
      {/* Top Greeting & Action Header (mirroring "Hello, Rahim 👋" in reference screenshot) */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="space-y-0.5">
          <span className="text-xs sm:text-sm font-medium text-[var(--lg-ink-muted)]">
            Hello,
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--lg-ink)] flex items-center gap-2">
            <span>{userName}</span>
            <span role="img" aria-label="wave">
              👋
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <GlassIconButton
            label="Toggle theme mode"
            onClick={toggleTheme}
            className="hover:scale-105 transition-transform"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-300" />
            ) : (
              <Moon className="h-5 w-5 text-[var(--lg-accent-start)]" />
            )}
          </GlassIconButton>

          <GlassIconButton
            label="Notification alerts"
            onClick={() => setUpdateAlerts(!updateAlerts)}
            className="hover:scale-105 transition-transform relative"
          >
            <Bell className="h-5 w-5 text-[var(--lg-ink)]" />
            {updateAlerts && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[var(--lg-badge-red)] ring-2 ring-white/50" />
            )}
          </GlassIconButton>
        </div>
      </div>

      {/* B7 / B9. 56px Capsule Search Bar with Trailing Filter Icon Button (matches screenshot) */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-5 h-5 w-5 text-[var(--lg-ink-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search applications, packages, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[56px] pl-13 pr-16 rounded-[9999px] glass-surface text-sm sm:text-base text-[var(--lg-ink)] placeholder-[var(--lg-ink-muted)] border border-white/40 shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--lg-accent-start)] transition-all"
          />

          {searchQuery && (
            <button
              aria-label="Clear search query"
              onClick={() => setSearchQuery('')}
              className="absolute right-14 p-2 text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] glass-pressable rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Trailing Filter Circle Button inside the capsule (matching screenshot) */}
          <button
            aria-label="Toggle filters"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="absolute right-2 h-[42px] w-[42px] rounded-full bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] flex items-center justify-center shadow-xs border border-white/40 glass-pressable hover:scale-105 transition-all"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Optional Filter drawer (if toggled) */}
      {showFilterDrawer && (
        <GlassSurface variant="card" className="p-4 sm:p-5 space-y-3 rounded-[24px]">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--lg-ink)]">
            <span>Sort & Order</span>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]"
            >
              Close
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-11 px-4 rounded-[16px] glass-surface text-xs font-semibold text-[var(--lg-ink)] border border-white/30 focus:outline-none"
            >
              <option value="updated" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                Recently Updated
              </option>
              <option value="downloads" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                Most Downloaded
              </option>
              <option value="name" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                Alphabetical (A–Z)
              </option>
            </select>
          </div>
        </GlassSurface>
      )}

      {/* B7 / B9. 48px Capsule Category Chips (matching screenshot "All", "Civil", "CSE" etc.) */}
      <div className="flex items-center gap-[12px] overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <GlassChip
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {/* B10. Cards in 2-Column Grid with 14px gap (matching screenshot) */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
          {filteredApps.map((app) => {
            const latestVer = versions.find((v) => v.id === app.latestPublishedVersionId);
            const count = aggregates.byApp[app.id] || 0;
            return (
              <AppCard
                key={app.id}
                app={app}
                latestVersion={latestVer}
                downloadCount={count}
              />
            );
          })}
        </div>
      ) : isInitialSyncLoading && publicApps.length === 0 ? (
        <GlassSurface variant="card" className="py-20 text-center p-8 space-y-4 rounded-[28px]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/30 dark:bg-white/10 text-[var(--lg-accent-start)] border border-white/40 shadow-xs">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-[var(--lg-ink)]">
            Syncing Published Applications...
          </h3>
          <p className="text-sm text-[var(--lg-ink-muted)] max-w-md mx-auto leading-relaxed">
            Connecting in real-time to the public Firestore repository to retrieve the latest verified APK releases.
          </p>
        </GlassSurface>
      ) : publicApps.length === 0 ? (
        /* B12. Empty State: one Surface card, centered Body text in inkMuted, one clear next step */
        <GlassSurface variant="card" className="py-20 text-center p-8 space-y-4 rounded-[28px]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/30 dark:bg-white/10 text-[var(--lg-accent-start)] border border-white/40 shadow-xs">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="text-lg font-bold text-[var(--lg-ink)]">
            No Applications Published Yet
          </h3>

          <p className="text-sm text-[var(--lg-ink-muted)] max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? 'The distribution hub is ready. As an administrator, you can upload Android APK packages or register apps.'
              : 'The distribution hub is active. Check back soon for new app releases and updates.'}
          </p>

          {isAdmin && (
            <div className="pt-2">
              <GlassButton variant="primary" onClick={() => navigateTo('admin-upload')}>
                <UploadCloud className="h-4 w-4" />
                <span>Upload First APK</span>
              </GlassButton>
            </div>
          )}
        </GlassSurface>
      ) : (
        /* Empty search state */
        <GlassSurface variant="card" className="py-16 text-center p-8 space-y-3 rounded-[28px]">
          <p className="text-base font-bold text-[var(--lg-ink)]">
            No applications found matching your criteria.
          </p>
          <p className="text-sm text-[var(--lg-ink-muted)] max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category filter.
          </p>
          <div className="pt-2">
            <GlassButton
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              <span>Reset all filters</span>
            </GlassButton>
          </div>
        </GlassSurface>
      )}

      {/* Interactive Toggle Card (matching "Message alerts / New chats from buyers" in reference screenshot) */}
      <GlassSurface
        variant="card"
        className="p-5 sm:p-6 rounded-[28px] flex items-center justify-between gap-4"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--lg-accent-start)] shrink-0" />
            <h4 className="font-bold text-[var(--lg-ink)] text-sm sm:text-base leading-tight truncate">
              Cryptographic Integrity
            </h4>
          </div>
          <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
            Realtime SHA-256 checksum check on all APK package downloads
          </p>
        </div>

        <GlassToggle
          checked={checksumVerification}
          onChange={setChecksumVerification}
          label="Toggle Cryptographic Integrity"
        />
      </GlassSurface>

      {/* Second Toggle Card */}
      <GlassSurface
        variant="card"
        className="p-5 sm:p-6 rounded-[28px] flex items-center justify-between gap-4"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--lg-accent-start)] shrink-0" />
            <h4 className="font-bold text-[var(--lg-ink)] text-sm sm:text-base leading-tight truncate">
              Release Notifications
            </h4>
          </div>
          <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
            Instant updates when new verified versions are deployed
          </p>
        </div>

        <GlassToggle
          checked={updateAlerts}
          onChange={setUpdateAlerts}
          label="Toggle Release Notifications"
        />
      </GlassSurface>

      {/* Design System Reference Quote (exact quote from screenshot bottom) */}
      <div className="px-3 py-2 text-center">
        <p className="text-[11px] sm:text-xs text-[var(--lg-ink-muted)] leading-relaxed opacity-80 max-w-xl mx-auto">
          "Glass only reads well over varied color. On plain white it looks flat, and light text on light glass fails contrast. Keep tint at 35% or more for body text."
        </p>
      </div>
    </div>
  );
};
