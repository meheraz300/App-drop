import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { VersionRecord } from '../../types';
import {
  RotateCcw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCode,
  Download,
  X,
  Check,
} from 'lucide-react';
import { canRollbackToVersion } from '../../lib/versionPolicy';

export const VersionManager: React.FC = () => {
  const { apps, versions, selectedAppId, rollbackVersion, updateReleaseNotes, navigateTo } = useApp();

  const [activeAppId, setActiveAppId] = useState<string>(selectedAppId || apps[0]?.id || '');
  const [editingVersion, setEditingVersion] = useState<VersionRecord | null>(null);
  const [rollbackConfirmVersion, setRollbackConfirmVersion] = useState<VersionRecord | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const activeApp = apps.find((a) => a.id === activeAppId);

  const appVersions = versions
    .filter((v) => v.appId === activeAppId)
    .sort((a, b) => b.versionCode - a.versionCode);

  const handleRollback = async () => {
    if (!activeApp || !rollbackConfirmVersion) return;

    const res = await rollbackVersion(activeApp.id, rollbackConfirmVersion.id);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Successfully rolled back to version ${rollbackConfirmVersion.versionName} (v${rollbackConfirmVersion.versionCode}).`,
      });
      setRollbackConfirmVersion(null);
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Failed to rollback version.',
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!editingVersion) return;
    await updateReleaseNotes(editingVersion.id, editNotesText);
    setEditingVersion(null);
    setFeedbackMsg({
      type: 'success',
      text: `Updated release notes for version ${editingVersion.versionName}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Version Management & Rollback
          </h2>
          <p className="text-xs text-neutral-500">
            Audit historical APK versions, update release notes, or atomically restore a prior release.
          </p>
        </div>

        {/* App selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Application:</span>
          <select
            value={activeAppId}
            onChange={(e) => {
              setActiveAppId(e.target.value);
              setFeedbackMsg(null);
            }}
            className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedbackMsg.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-75 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-8 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">No Applications Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Create an application profile first before managing release versions.
          </p>
          <button
            onClick={() => navigateTo('admin-apps')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Register Application</span>
          </button>
        </div>
      ) : (
        /* Version Table */
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Binary Size</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {appVersions.map((ver) => {
                const isCurrent = ver.id === activeApp?.latestPublishedVersionId;
                const sizeMb = (ver.apkSizeBytes / (1024 * 1024)).toFixed(1);

                return (
                  <tr
                    key={ver.id}
                    className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors ${
                      isCurrent ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 dark:text-white font-mono">
                            v{ver.versionName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              Current Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          Code: {ver.versionCode}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-emerald-600 dark:text-emerald-400">
                        {ver.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">{sizeMb} MB</td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {ver.sha256.slice(0, 16)}...{ver.sha256.slice(-8)}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400">
                      {ver.publishedAt ? new Date(ver.publishedAt).toLocaleDateString() : 'Draft'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingVersion(ver);
                            setEditNotesText(ver.releaseNotes);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Notes
                        </button>

                        {!isCurrent && ver.status === 'published' && (
                          <button
                            onClick={() => setRollbackConfirmVersion(ver)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal: Edit Release Notes */}
      {editingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Release Notes: v{editingVersion.versionName}
              </h3>
              <button
                onClick={() => setEditingVersion(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              rows={5}
              value={editNotesText}
              onChange={(e) => setEditNotesText(e.target.value)}
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingVersion(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rollback Confirmation */}
      {rollbackConfirmVersion && activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Confirm Version Rollback
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Are you sure you want to promote{' '}
              <span className="font-bold font-mono text-neutral-900 dark:text-white">
                v{rollbackConfirmVersion.versionName} (v{rollbackConfirmVersion.versionCode})
              </span>{' '}
              to be the latest published release for "{activeApp.name}"?
            </p>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-xs space-y-1 text-neutral-500">
              <div>• All historical version binaries remain preserved in storage.</div>
              <div>• The public download pointer will instantly redirect to this verified build.</div>
              <div>• This operation is audited.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRollbackConfirmVersion(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
