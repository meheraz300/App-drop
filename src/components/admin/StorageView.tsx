import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HardDrive, AlertTriangle, ShieldCheck, Check, DollarSign } from 'lucide-react';

export const StorageView: React.FC = () => {
  const { apps, versions, systemConfig, updateSystemConfig } = useApp();

  const [maxSizeMb, setMaxSizeMb] = useState<number>(
    Math.round(systemConfig.maxUploadSizeBytes / (1024 * 1024))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Storage Utilization & Upload Quota
        </h2>
        <p className="text-xs text-neutral-500">
          Control maximum APK file sizes, monitor Cloud Storage footprint, and review egress budgets.
        </p>
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
          <span className="text-xs text-neutral-500">Total Archived Binaries</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {versions.length}
          </div>
          <span className="text-[11px] text-neutral-400 block">Immutable APK packages</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
          <span className="text-xs text-neutral-500">Configured Max APK Limit</span>
          <div className="text-3xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
            {maxSizeMb} <span className="text-sm font-sans font-normal text-neutral-400">MB</span>
          </div>
          <span className="text-[11px] text-neutral-400 block">Enforced on backend upload</span>
        </div>
      </div>

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
      </section>
    </div>
  );
};
