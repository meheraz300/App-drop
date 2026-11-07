import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardDrive,
  AlertTriangle,
  ShieldCheck,
  Check,
  Trash2,
  RefreshCw,
  CloudOff,
  Database,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const StorageView: React.FC = () => {
  const { apps, versions, systemConfig, updateSystemConfig, purgeAllStorage, quotaStatus } = useApp();

  const [maxSizeMb, setMaxSizeMb] = useState<number>(
    Math.round(systemConfig.maxUploadSizeBytes / (1024 * 1024))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{
    cloudDeleted: number;
    serverDeleted: number;
    serverFreedBytes: number;
  } | null>(null);
  const [serverStats, setServerStats] = useState<{
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMb: string;
  } | null>(null);

  // Fetch live server disk storage statistics
  const fetchServerStats = async () => {
    try {
      const res = await fetch('/api/apks/stats');
      if (res.ok) {
        const data = await res.json();
        setServerStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch server storage stats:', err);
    }
  };

  useEffect(() => {
    fetchServerStats();
  }, [versions.length]);

  const totalBytes = versions.reduce((sum, v) => sum + (v.apkSizeBytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalGb = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);

  // Group by app
  const appStorage = apps.map((app) => {
    const appVers = versions.filter((v) => v.appId === app.id);
    const bytes = appVers.reduce((s, v) => s + (v.apkSizeBytes || 0), 0);
    return {
      app,
      bytes,
      mb: (bytes / (1024 * 1024)).toFixed(1),
      count: appVers.length,
    };
  });

  const handleSaveLimit = async () => {
    const bytes = maxSizeMb * 1024 * 1024;
    await updateSystemConfig({ maxUploadSizeBytes: bytes });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePurgeAll = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete ALL previously stored APK files from Firebase Cloud Storage and server disk? This will immediately free up all storage quotas.'
    );
    if (!confirmed) return;

    setIsPurging(true);
    setPurgeResult(null);
    try {
      const res = await purgeAllStorage();
      setPurgeResult(res);
      await fetchServerStats();
    } catch (err) {
      console.error('Purge error:', err);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Storage Utilization & Quota Management
          </h2>
          <p className="text-xs text-neutral-500">
            Control maximum APK file sizes, monitor Cloud Storage footprint, and purge storage quotas.
          </p>
        </div>

        <button
          onClick={handlePurgeAll}
          disabled={isPurging}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {isPurging ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span>{isPurging ? 'Purging Storage...' : 'Purge All Previous Stored Files'}</span>
        </button>
      </div>

      {/* Purge Result Banner */}
      {purgeResult && (
        <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Purge complete! Erased {purgeResult.cloudDeleted} file(s) from Firebase Cloud Storage
              and {purgeResult.serverDeleted} file(s) from server storage (
              {(purgeResult.serverFreedBytes / (1024 * 1024)).toFixed(2)} MB quota reclaimed).
            </span>
          </div>
          <button
            onClick={() => setPurgeResult(null)}
            className="font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Lifecycle Policy Banner */}
      <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Automated APK Lifecycle & Quota Policy Active</span>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Whenever an application is deleted in the admin panel, all associated APK binaries are
            automatically and permanently erased from Firebase Cloud Storage and server storage,
            ensuring your project storage quotas are never exceeded.
          </p>
        </div>
      </div>

      {/* Storage Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Total Binary Volume</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {totalMb} <span className="text-sm font-sans font-normal text-neutral-400">MB</span>
          </div>
          <span className="text-[11px] text-neutral-400 block font-mono">({totalGb} GB stored)</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Live Disk Storage</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {serverStats ? serverStats.totalSizeMb : totalMb}{' '}
            <span className="text-sm font-sans font-normal text-neutral-400">MB</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">
            {serverStats ? `${serverStats.totalFiles} server binaries` : `${versions.length} binaries`}
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Configured Max APK Limit</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {maxSizeMb} <span className="text-sm font-sans font-normal text-neutral-400">MB</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">Enforced on backend upload</span>
        </div>
      </div>

      {/* Cloud Firestore Quota Management Card */}
      <section className="p-6 rounded-2xl border border-amber-300/40 dark:border-amber-800/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
              <Database className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Cloud Firestore Spark Free Tier Limits
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Project Number: 913321892239 • Database: <code className="font-mono text-[11px]">ai-studio-appdropandroidap-18a8d25f-ed9f-45c2-bf2e-ade5b99e6fef</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={quotaStatus.upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 shadow-xs transition-colors"
            >
              <span>Upgrade Database in Firebase Console</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-neutral-900/70 border border-amber-500/20 text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Quota Metric: Free daily write units per project (free tier database)</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            When free write units reach their daily ceiling, AppDrop automatically switches to local caching and server binary storage so downloads, uploads, and local modifications remain 100% operational. The free quota resets daily at midnight Pacific Time (00:00 UTC-8).
          </p>
          <div className="pt-1">
            <a
              href={quotaStatus.pricingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              <span>View Firebase Cloud Firestore Pricing & Spark Plan Limits</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Configurable Max Size Settings */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          Configure Maximum APK Upload Size
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
          The default limit is set to 500 MB in accordance with Master PRD specifications. You can adjust this threshold to control Cloud Storage bandwidth and protect execution budgets.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={2000}
              value={maxSizeMb}
              onChange={(e) => setMaxSizeMb(parseInt(e.target.value, 10) || 500)}
              className="h-10 w-32 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono font-bold"
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">Megabytes (MB)</span>
          </div>

          <button
            onClick={handleSaveLimit}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            {savedSuccess ? <Check className="h-4 w-4" /> : null}
            <span>{savedSuccess ? 'Limit Updated' : 'Save Quota Limit'}</span>
          </button>
        </div>
      </section>

      {/* Storage Breakdown by Application */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          Storage Breakdown by Application
        </h3>

        {appStorage.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No applications registered. Storage is currently empty.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs">
            {appStorage.map(({ app, mb, count }) => (
              <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-neutral-900 dark:text-white block">
                    {app.name}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-500">{app.packageName}</span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                    {mb} MB
                  </span>
                  <span className="text-[11px] text-neutral-400 block font-mono">
                    {count} {count === 1 ? 'version' : 'versions'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
