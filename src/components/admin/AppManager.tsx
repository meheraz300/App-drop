import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { AppRecord } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  UploadCloud,
  History,
  AlertTriangle,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import { validatePackageName } from '../../lib/apkValidator';
import { calculateDeletionImpact } from '../../lib/versionPolicy';
import { IconImageUploader } from '../common/IconImageUploader';

export const AppManager: React.FC = () => {
  const { apps, versions, createApp, updateApp, archiveApp, restoreApp, deleteApp, navigateTo } =
    useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppRecord | null>(null);
  const [deletingApp, setDeletingApp] = useState<AppRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    packageName: '',
    shortDescription: '',
    description: '',
    category: 'Tools',
    tags: 'utility, tools',
    iconPath: '',
    screenshotPaths: '',
    visibility: 'public' as 'public' | 'unlisted',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: '',
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.packageName.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === 'All' || app.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [apps, search, categoryFilter]);

  const openCreateModal = () => {
    setFormData({
      name: '',
      packageName: '',
      shortDescription: '',
      description: '',
      category: 'Tools',
      tags: 'utility, tools',
      iconPath: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>`,
      screenshotPaths: '',
      visibility: 'public',
      mandatoryUpdate: false,
      minimumSupportedVersionCode: '',
    });
    setFormErrors([]);
    setIsCreateOpen(true);
  };

  const openEditModal = (app: AppRecord) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      packageName: app.packageName,
      shortDescription: app.shortDescription,
      description: app.description,
      category: app.category,
      tags: app.tags.join(', '),
      iconPath: app.iconPath,
      screenshotPaths: app.screenshotPaths.join('\n'),
      visibility: app.visibility,
      mandatoryUpdate: app.mandatoryUpdate,
      minimumSupportedVersionCode: app.minimumSupportedVersionCode?.toString() || '',
    });
    setFormErrors([]);
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Application title is required.');

    const pkgCheck = validatePackageName(formData.packageName);
    if (!pkgCheck.valid && pkgCheck.error) errors.push(pkgCheck.error);

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: Partial<AppRecord> = {
      name: formData.name.trim(),
      packageName: formData.packageName.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      iconPath: formData.iconPath.trim(),
      screenshotPaths: formData.screenshotPaths.split('\n').map((s) => s.trim()).filter(Boolean),
      visibility: formData.visibility,
      mandatoryUpdate: formData.mandatoryUpdate,
      minimumSupportedVersionCode: formData.minimumSupportedVersionCode
        ? parseInt(formData.minimumSupportedVersionCode, 10)
        : null,
    };

    if (editingApp) {
      await updateApp(editingApp.id, payload);
      setEditingApp(null);
    } else {
      await createApp(payload);
      setIsCreateOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingApp) return;
    await deleteApp(deletingApp.id);
    setDeletingApp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Application Inventory
          </h2>
          <p className="text-xs text-neutral-500">
            Create, update, archive, or manage Android application records.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8.5 pl-9 pr-3 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          <span className="text-xs text-neutral-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Tools">Tools</option>
            <option value="Productivity">Productivity</option>
            <option value="Personalization">Personalization</option>
            <option value="Media & Audio">Media & Audio</option>
            <option value="Utilities">Utilities</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Package Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latest Version</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              {filteredApps.map((app) => {
                const latestVer = versions.find((v) => v.id === app.latestPublishedVersionId);
                const isArchived = app.status === 'archived';

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.iconPath}
                          alt=""
                          className="h-9 w-9 rounded-xl object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-900 dark:text-white block truncate">
                            {app.name}
                          </span>
                          {app.mandatoryUpdate && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                              Mandatory Update Active
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {app.packageName}
                    </td>

                    <td className="py-3.5 px-4">{app.category}</td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize">{app.visibility}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`capitalize font-medium ${
                          app.status === 'published'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {latestVer ? `v${latestVer.versionName}` : 'None'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            navigateTo('admin-upload', app.id);
                          }}
                          title="Upload new APK version"
                          className="p-1.5 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <UploadCloud className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            navigateTo('admin-versions', app.id);
                          }}
                          title="Manage versions & rollback"
                          className="p-1.5 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          title="Edit metadata"
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isArchived ? (
                          <button
                            onClick={() => restoreApp(app.id)}
                            title="Restore application"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => archiveApp(app.id)}
                            title="Archive application (hide from public)"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingApp(app)}
                          title="Permanently delete application"
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Application */}
      {(isCreateOpen || editingApp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingApp ? `Edit ${editingApp.name}` : 'Create New Application'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingApp(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveApp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Application Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Nova Launcher"
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Android Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    placeholder="com.example.app"
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="Tools">Tools</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Personalization">Personalization</option>
                    <option value="Media & Audio">Media & Audio</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="public">Public (Visible in directory)</option>
                    <option value="unlisted">Unlisted (Direct link only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence summary for app cards"
                  className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Full Description & Features
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of capabilities..."
                  className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1.5">
                  Application Icon *
                </label>
                <IconImageUploader
                  value={formData.iconPath}
                  onChange={(dataUrl) => setFormData({ ...formData, iconPath: dataUrl })}
                  appName={formData.name}
                />
              </div>

              {/* Mandatory Update Control */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white block">
                      Mandatory Update Policy
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Displays a prominent update notice for users with older versions
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.mandatoryUpdate}
                    onChange={(e) => setFormData({ ...formData, mandatoryUpdate: e.target.checked })}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {formData.mandatoryUpdate && (
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 text-[11px] font-medium mb-1">
                      Minimum Supported Version Code
                    </label>
                    <input
                      type="number"
                      value={formData.minimumSupportedVersionCode}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumSupportedVersionCode: e.target.value })
                      }
                      placeholder="e.g. 100"
                      className="w-full h-8.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingApp(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingApp ? 'Save Changes' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Permanent Deletion Impact Confirmation */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Permanently Delete Application?
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This action is <span className="font-bold text-red-600">irreversible</span>. You are about to permanently purge{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">"{deletingApp.name}"</span> and all associated storage objects.
            </p>

            {/* Impact Details */}
            {(() => {
              const impact = calculateDeletionImpact(deletingApp, versions);
              return (
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Historical Versions:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{impact.versionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Storage to Purge:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {(impact.totalStorageBytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setDeletingApp(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
