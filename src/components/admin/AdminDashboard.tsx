import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Grid,
  CheckCircle2,
  Download,
  HardDrive,
  Wrench,
  UploadCloud,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { computeDownloadAggregates } from '../../lib/analyticsTracker';
import { GlassSurface, GlassButton, GlassTag } from '../common/GlassComponents';

export const AdminDashboard: React.FC = () => {
  const { apps, versions, downloadStats, auditLogs, systemConfig, navigateTo } = useApp();

  const aggregates = useMemo(() => computeDownloadAggregates(downloadStats), [downloadStats]);

  const publishedApps = apps.filter((a) => a.status === 'published');
  const totalStorageBytes = versions.reduce((sum, v) => sum + (v.apkSizeBytes || 0), 0);
  const totalStorageMb = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  // Recent 5 published releases
  const recentReleases = [...versions]
    .filter((v) => v.status === 'published')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recent 5 audit logs
  const recentLogs = auditLogs.slice(0, 5);

  // SVG Chart calculation for daily trends
  const trendPoints = aggregates.dailyTrends.slice(-7);
  const maxTrendCount = Math.max(...trendPoints.map((p) => p.count), 10);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <GlassSurface variant="card" className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[var(--lg-ink)]">
            Operations & Release Overview
          </h2>
          <p className="text-xs text-[var(--lg-ink-muted)]">
            Monitor binary storage, download requests, and publish new application builds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <GlassButton
            variant="secondary"
            onClick={() => navigateTo('admin-apps')}
            className="h-11 px-5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New App</span>
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={() => navigateTo('admin-upload')}
            className="h-11 px-5 text-xs"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload APK</span>
          </GlassButton>
        </div>
      </GlassSurface>

      {/* Primary KPI Metrics Grid (B6 28px radius) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Apps */}
        <GlassSurface variant="card" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--lg-ink-muted)] text-xs font-semibold">
            <span>Total Applications</span>
            <Grid className="h-4 w-4 text-[var(--lg-accent-start)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--lg-ink)] font-mono tabular-nums">
            {apps.length}
          </div>
          <div className="text-[11px] text-[var(--lg-ink-muted)] font-medium">
            {publishedApps.length} active in public directory
          </div>
        </GlassSurface>

        {/* Total Downloads */}
        <GlassSurface variant="card" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--lg-ink-muted)] text-xs font-semibold">
            <span>Download Requests</span>
            <Download className="h-4 w-4 text-[var(--lg-success)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--lg-ink)] font-mono tabular-nums">
            {aggregates.totalDownloads.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--lg-ink-muted)] font-medium">Server-observed URL issuances</div>
        </GlassSurface>

        {/* Stored Binaries */}
        <GlassSurface variant="card" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--lg-ink-muted)] text-xs font-semibold">
            <span>APK Storage Used</span>
            <HardDrive className="h-4 w-4 text-[var(--lg-info)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--lg-ink)] font-mono tabular-nums">
            {totalStorageMb} MB
          </div>
          <div className="text-[11px] text-[var(--lg-ink-muted)] font-medium">
            Across {versions.length} historical versions
          </div>
        </GlassSurface>

        {/* System State */}
        <GlassSurface variant="card" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[var(--lg-ink-muted)] text-xs font-semibold">
            <span>System State</span>
            {systemConfig.maintenanceMode ? (
              <Wrench className="h-4 w-4 text-[var(--lg-error)]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[var(--lg-success)]" />
            )}
          </div>
          <div className="text-3xl font-extrabold text-[var(--lg-ink)] font-mono">
            {systemConfig.maintenanceMode ? 'Maintenance' : 'Operational'}
          </div>
          <div className="text-[11px] text-[var(--lg-ink-muted)] font-medium">
            Upload limit: {(systemConfig.maxUploadSizeBytes / (1024 * 1024)).toFixed(0)} MB
          </div>
        </GlassSurface>
      </div>

      {/* Activity and Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Activity Mini-Chart */}
        <GlassSurface variant="card" className="lg:col-span-3 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--lg-ink)]">
                Daily Download Requests Trend
              </h3>
              <p className="text-xs text-[var(--lg-ink-muted)]">Last 7 recorded activity periods</p>
            </div>
            <GlassTag variant="info">Active Distribution</GlassTag>
          </div>

          {/* Sparkline / Bar Chart */}
          <div className="h-36 flex items-end gap-3 pt-4 border-b border-white/20 pb-2">
            {trendPoints.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--lg-ink-muted)] italic">
                No recent activity registered in local metrics
              </div>
            ) : (
              trendPoints.map((point) => {
                const heightPercent = Math.max((point.count / maxTrendCount) * 100, 8);
                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-mono text-[var(--lg-ink-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.count}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t-xl bg-gradient-to-t from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] border border-white/40 shadow-xs transition-all group-hover:brightness-110"
                    />
                    <div className="text-[10px] font-mono text-[var(--lg-ink-muted)] truncate max-w-full font-medium">
                      {point.date.slice(5)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-[var(--lg-ink-muted)] italic leading-relaxed">
            * Note: Counters reflect server-observed download link issuance events, not proof of file transfer completion on end-user hardware.
          </p>
        </GlassSurface>

        {/* Recent Releases */}
        <GlassSurface variant="card" className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--lg-ink)]">Recent APK Publications</h3>
            <button
              onClick={() => navigateTo('admin-versions')}
              className="text-xs text-[var(--lg-accent-start)] hover:underline font-bold glass-pressable"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-white/20">
            {recentReleases.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--lg-ink-muted)] italic">
                No APK versions published yet. Use Upload APK to release your first build.
              </div>
            ) : (
              recentReleases.map((ver) => {
                const app = apps.find((a) => a.id === ver.appId);
                const sizeMb = (ver.apkSizeBytes / (1024 * 1024)).toFixed(1);
                return (
                  <div key={ver.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[var(--lg-ink)] truncate">
                        {app?.name || ver.appId}
                      </div>
                      <div className="text-[11px] text-[var(--lg-ink-muted)] flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--lg-accent-start)]">v{ver.versionName}</span>
                        <span aria-hidden="true">·</span>
                        <span>Code: {ver.versionCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sizeMb} MB</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--lg-ink-muted)] shrink-0 font-medium">
                      {ver.publishedAt ? new Date(ver.publishedAt).toLocaleDateString() : 'Draft'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassSurface>

        {/* Audit Log Peek */}
        <GlassSurface variant="card" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--lg-ink)]">Administrative Audit Log</h3>
            <button
              onClick={() => navigateTo('admin-activity')}
              className="text-xs text-[var(--lg-accent-start)] hover:underline font-bold glass-pressable"
            >
              Full log
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--lg-ink-muted)] italic">
                No administrative activity logged yet.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-[16px] bg-white/20 dark:bg-white/5 border border-white/30 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[var(--lg-accent-start)] text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-[var(--lg-ink-muted)] font-medium">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--lg-ink-muted)] line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassSurface>
      </div>
    </div>
  );
};
