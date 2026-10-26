import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Info, Calendar, Download } from 'lucide-react';
import { computeDownloadAggregates } from '../../lib/analyticsTracker';

export const AnalyticsView: React.FC = () => {
  const { apps, versions, downloadStats } = useApp();
  const [filterAppId, setFilterAppId] = useState<string>('all');

  const aggregates = useMemo(() => computeDownloadAggregates(downloadStats), [downloadStats]);

  const filteredStats = useMemo(() => {
    if (filterAppId === 'all') return downloadStats;
    return downloadStats.filter((s) => s.appId === filterAppId);
  }, [downloadStats, filterAppId]);

  const filteredAggregates = useMemo(
    () => computeDownloadAggregates(filteredStats),
    [filteredStats]
  );

  const maxDailyCount = Math.max(
    ...filteredAggregates.dailyTrends.map((d) => d.count),
    10
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Download Request Analytics
          </h2>
          <p className="text-xs text-neutral-500">
            Track total, per-application, per-version, and daily distribution metrics.
          </p>
        </div>

        {/* Filter by app */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Filter App:</span>
          <select
            value={filterAppId}
            onChange={(e) => setFilterAppId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Applications</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Semantics Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Download Metric Semantics</span>
          <p className="leading-relaxed text-blue-800 dark:text-blue-300">
            Analytics metrics record server-observed download requests and authorized download URL issuances. They do not constitute guarantee or proof that the binary was completely saved to the visitor's hardware.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Total Issuances</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {filteredAggregates.totalDownloads.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-400 block">Across selected timeframe</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Active Applications</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {filterAppId === 'all' ? apps.length : 1}
          </div>
          <span className="text-[11px] text-neutral-400 block">Covered in report</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Tracked Versions</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {Object.keys(filteredAggregates.byVersion).length}
          </div>
          <span className="text-[11px] text-neutral-400 block">Distinct version downloads</span>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Daily Trend Timeline
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {filteredAggregates.dailyTrends.length} recorded days
          </span>
        </div>

        <div className="h-56 w-full pt-6 flex items-end justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          {filteredAggregates.dailyTrends.map((trend) => {
            const height = Math.max((trend.count / maxDailyCount) * 100, 10);
            return (
              <div key={trend.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                <span className="text-[11px] font-mono text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {trend.count}
                </span>
                <div
                  style={{ height: `${height}%` }}
                  className="w-full max-w-[40px] rounded-t-md bg-emerald-500/80 group-hover:bg-emerald-600 transition-colors"
                />
                <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">
                  {trend.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Breakdown Tables: Per-App and Per-Version */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-App Totals */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Volume by Application
          </h3>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs">
            {apps.map((app) => {
              const count = aggregates.byApp[app.id] || 0;
              const percent = aggregates.totalDownloads > 0
                ? ((count / aggregates.totalDownloads) * 100).toFixed(1)
                : '0.0';

              return (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white block">
                      {app.name}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-500">{app.packageName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                      {count.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-400 block tabular-nums">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Version Totals */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Volume by Version Release
          </h3>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs">
            {versions.map((ver) => {
              const parentApp = apps.find((a) => a.id === ver.appId);
              const key = `${ver.appId}:${ver.id}`;
              const count = aggregates.byVersion[key] || 0;

              return (
                <div key={ver.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {parentApp?.name || ver.appId} v{ver.versionName}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono block">
                      Code {ver.versionCode}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                    {count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
