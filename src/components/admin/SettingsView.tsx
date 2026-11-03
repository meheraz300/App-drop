import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Wrench, ShieldCheck, Download, Check, AlertTriangle, Key } from 'lucide-react';
import { ADMIN_CONFIGURED_EMAIL } from '../../lib/firebase';

export const SettingsView: React.FC = () => {
  const { systemConfig, updateSystemConfig, apps, versions, downloadStats, auditLogs } = useApp();

  const [maintenanceMode, setMaintenanceMode] = useState(systemConfig.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(systemConfig.maintenanceMessage);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    await updateSystemConfig({
      maintenanceMode,
      maintenanceMessage,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      systemConfig,
      apps,
      versions,
      downloadStats,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appdrop_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          System Configuration & Maintenance
        </h2>
        <p className="text-xs text-neutral-500">
          Manage platform availability, announcement notices, and administrative identity records.
        </p>
      </div>

      {/* Maintenance Mode Configuration */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-5 text-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" />
              <span>Public Maintenance Mode</span>
            </h3>
            <p className="text-neutral-500 leading-relaxed max-w-xl">
              When enabled, a prominent maintenance banner is displayed on the public site informing visitors of scheduled maintenance or temporary binary deployment pauses. The authorized administrator retains full access.
            </p>
          </div>

          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              maintenanceMode ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                maintenanceMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1.5">
            Public Announcement Notice
          </label>
          <textarea
            rows={2}
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {saveSuccess ? <Check className="h-4 w-4" /> : null}
            <span>{saveSuccess ? 'Settings Saved' : 'Save System Settings'}</span>
          </button>
        </div>
      </section>

      {/* Administrator Identity Specification */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Configured Administrator Identity</span>
        </h3>

        <p className="text-neutral-500 leading-relaxed">
          In strict accordance with PRD Section 6.2, administrative privileges are granted exclusively to the verified administrator email. Merely signing in with an unverified or unauthorized Google account will deny mutation privileges.
        </p>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-1 font-mono">
          <span className="text-neutral-400 text-[11px] block">Master Administrator Email:</span>
          <span className="text-neutral-900 dark:text-white font-bold text-sm">
            {ADMIN_CONFIGURED_EMAIL}
          </span>
        </div>
      </section>

      {/* Disaster Recovery & Data Backup */}
      <section className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-600" />
          <span>Database & Metadata Backup Export</span>
        </h3>

        <p className="text-neutral-500 leading-relaxed">
          Export a complete, recoverable JSON snapshot containing all application records, version histories, checksum digests, download counters, and append-only audit records.
        </p>

        <div className="pt-1">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Database Snapshot (.json)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
