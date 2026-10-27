import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  Download,
  FolderPlus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { IconImageUploader } from '../common/IconImageUploader';

const CATEGORIES = [
  'Tools',
  'Productivity',
  'Personalization',
  'Media & Audio',
  'Utilities',
  'Communication',
];

const DEFAULT_GRADIENT_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>`;

export const ApkUploader: React.FC = () => {
  const {
    apps,
    selectedAppId,
    systemConfig,
    uploadProgress,
    startApkUpload,
    resetUploadProgress,
    navigateTo,
    requestDownload,
  } = useApp();

  // Mode: direct auto-detect (no prior registration needed) or attach to existing app
  const [uploadMode, setUploadMode] = useState<'auto' | 'existing'>('auto');
  const [targetAppId, setTargetAppId] = useState<string>(selectedAppId || apps[0]?.id || '');

  // File & metadata
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appCategory, setAppCategory] = useState('Tools');
  const [appIcon, setAppIcon] = useState(DEFAULT_GRADIENT_ICON);
  const [appShortDesc, setAppShortDesc] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  // UI helpers
  const [copiedSha, setCopiedSha] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isDownloadingTest, setIsDownloadingTest] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetApp = apps.find((a) => a.id === targetAppId);
  const maxMb = (systemConfig.maxUploadSizeBytes / (1024 * 1024)).toFixed(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const cleanNameFromFileName = (fileName: string): string => {
    const raw = fileName.replace(/\.apk$/i, '');
    const withoutVer = raw.replace(/[-_]?(v|version|build|rc)?\d+.*$/i, '');
    const candidate = withoutVer.trim() || raw;
    return candidate
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  const handleFileSelected = (file: File) => {
    resetUploadProgress();
    setDownloadNotice(null);

    const isApk =
      file.name.toLowerCase().endsWith('.apk') ||
      file.type === 'application/vnd.android.package-archive';

    if (!isApk && !file.name.toLowerCase().includes('.apk')) {
      const proceed = confirm(
        `The selected file "${file.name}" does not have an .apk extension. Proceed anyway?`
      );
      if (!proceed) return;
    }

    setSelectedFile(file);

    // Auto-populate App Title if not already customized
    if (!appTitle.trim()) {
      const suggested = cleanNameFromFileName(file.name);
      if (suggested) {
        setAppTitle(suggested);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const chosenAppId = uploadMode === 'existing' && targetAppId ? targetAppId : '';
    await startApkUpload(selectedFile, releaseNotes, chosenAppId, {
      name: appTitle.trim() || undefined,
      category: appCategory,
      iconPath: appIcon,
      shortDescription: appShortDesc.trim() || undefined,
    });
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleTestDownload = async () => {
    const appId = uploadProgress.verifiedMetadata?.appId || targetAppId;
    if (!appId) return;

    try {
      setIsDownloadingTest(true);
      const appRecord = apps.find((a) => a.id === appId);
      const versionId = appRecord?.latestPublishedVersionId;
      if (!versionId) {
        setDownloadNotice('Published version record not found for testing download.');
        return;
      }

      const { downloadUrl, fileName } = await requestDownload(appId, versionId);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setDownloadNotice(`Downloaded "${fileName}" with exact original byte size verified!`);
    } catch (err: any) {
      setDownloadNotice(`Download test failed: ${err?.message || err}`);
    } finally {
      setIsDownloadingTest(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Upload & Publish Android APK
        </h2>
        <p className="text-xs text-neutral-500">
          Upload any Android package (.apk). AppDrop inspects bytecode, verifies signing certificates, computes cryptographic checksums, and publishes with original byte preservation.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-6">
        <form onSubmit={handleUploadSubmit} className="space-y-6 text-xs">
          {/* Target Mode Segmented Switcher */}
          <div className="space-y-2">
            <label className="block text-neutral-700 dark:text-neutral-300 font-semibold">
              Publishing Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('auto')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  uploadMode === 'auto'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-neutral-900 dark:text-white ring-1 ring-blue-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Direct Upload & Auto-Detect</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  No prior registration required. Auto-creates app record or matches existing package name.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (apps.length > 0) {
                    setUploadMode('existing');
                  } else {
                    setUploadMode('auto');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  uploadMode === 'existing'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-neutral-900 dark:text-white ring-1 ring-blue-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Layers className="h-4 w-4 text-neutral-600 dark:text-neutral-300 shrink-0" />
                  <span>Target Existing Application</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {apps.length > 0
                    ? `Assign version directly to one of ${apps.length} registered apps.`
                    : 'Disabled (no registered apps exist yet; use Direct Upload).'}
                </p>
              </button>
            </div>
          </div>

          {/* Existing App Selector (if selected) */}
          {uploadMode === 'existing' && apps.length > 0 && (
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                Target Application *
              </label>
              <select
                value={targetAppId}
                onChange={(e) => {
                  setTargetAppId(e.target.value);
                  resetUploadProgress();
                }}
                disabled={uploadProgress.stage !== 'idle' && uploadProgress.stage !== 'completed' && uploadProgress.stage !== 'error'}
                className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.packageName})
                  </option>
                ))}
              </select>
              {targetApp && (
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Enforces matching package name: <span className="font-mono text-neutral-600 dark:text-neutral-300 font-semibold">{targetApp.packageName}</span>
                </span>
              )}
            </div>
          )}

          {/* Android APK File Picker (relaxed accept filter so APKs show up in native dialogs) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-neutral-700 dark:text-neutral-300 font-semibold">
                Android Package File (.apk) *
              </label>
              <span className="text-[11px] text-neutral-400">
                Max limit: {maxMb} MB · All files selectable
              </span>
            </div>

            {/* Hidden native input with broad accept filter */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive,application/octet-stream,application/x-zip-compressed,*/*"
              onChange={handleFileInput}
              className="hidden"
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 bg-neutral-50/40 dark:bg-neutral-800/30'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-xs">
                  <UploadCloud className="h-6 w-6" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <span className="font-semibold text-neutral-900 dark:text-white text-sm block break-all">
                      {selectedFile.name}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500 font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <span>({selectedFile.size.toLocaleString()} bytes preserved)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block"
                    >
                      Change selected file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 block text-xs sm:text-sm">
                      Drop APK package here or click to browse
                    </span>
                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                      All file types are enabled in the picker so .apk files will never be greyed out.
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">
                        <FileCode className="h-3.5 w-3.5" />
                        <span>Select File from Disk</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct Upload Customization Fields (Available in auto mode or for overriding) */}
          {uploadMode === 'auto' && (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white text-xs">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Application Profile Details (Auto-Created if New)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Application Display Title
                  </label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="e.g. Proton Mail, Nova Launcher"
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    Leave blank to auto-extract from package identity
                  </span>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
                  Short Summary
                </label>
                <input
                  type="text"
                  value={appShortDesc}
                  onChange={(e) => setAppShortDesc(e.target.value)}
                  placeholder="One sentence description for application directory card..."
                  className="w-full h-9 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Direct App Icon Uploader with live preview & presets */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1.5">
                  Application Icon (Image Upload or Preset)
                </label>
                <IconImageUploader
                  value={appIcon}
                  onChange={setAppIcon}
                  appName={appTitle || 'App'}
                />
              </div>
            </div>
          )}

          {/* Release Notes */}
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
              Release Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="e.g. • Resolved landscape mode orientation bug&#10;• Upgraded target SDK to Android 15&#10;• Battery optimization and reduced memory footprint"
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions & Upload Button */}
          {uploadProgress.stage === 'idle' && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-neutral-500">
                {selectedFile ? 'Ready to upload & publish' : 'Select an APK package above to begin'}
              </span>
              <button
                type="submit"
                disabled={!selectedFile}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Upload, Validate & Publish</span>
              </button>
            </div>
          )}
        </form>

        {/* Progress Pipeline & Validation State Machine */}
        {uploadProgress.stage !== 'idle' && (
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-4 text-xs">
            {/* Header Stage */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                Pipeline Status: <span className="capitalize">{uploadProgress.stage}</span>
              </span>
              <span className="font-mono tabular-nums text-neutral-500">
                {uploadProgress.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div
                style={{ width: `${uploadProgress.percentage}%` }}
                className={`h-full transition-all duration-300 ${
                  uploadProgress.stage === 'error'
                    ? 'bg-red-500'
                    : uploadProgress.stage === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-blue-600'
                }`}
              />
            </div>

            {uploadProgress.details && (
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {uploadProgress.details}
              </p>
            )}

            {/* Error Message */}
            {uploadProgress.stage === 'error' && (
              <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Validation Error</span>
                </div>
                <p className="text-[11px] leading-relaxed">{uploadProgress.error}</p>
                <div className="pt-2">
                  <button
                    onClick={resetUploadProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 font-medium hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry with adjusted package</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success Summary & Verified Card */}
            {uploadProgress.stage === 'completed' && uploadProgress.verifiedMetadata && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Release Successfully Published!</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 font-mono">
                  <div>
                    <span className="text-neutral-500 text-[11px] block">Application:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {uploadProgress.verifiedMetadata.appName || appTitle || 'Application'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[11px] block">Extracted Package:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {uploadProgress.verifiedMetadata.packageName}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[11px] block">Version:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      v{uploadProgress.verifiedMetadata.versionName} (code {uploadProgress.verifiedMetadata.versionCode})
                    </span>
                  </div>
                </div>

                {/* Exact Binary Size Preservation Notice */}
                {selectedFile && (
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/70 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 font-mono">
                      <span>Exact Binary Stored:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB ({selectedFile.size.toLocaleString()} bytes)
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Byte stream and original ZIP compression headers are 100% preserved in persistent IndexedDB storage.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-500 text-[11px]">Computed SHA-256 Digest:</span>
                    <button
                      onClick={() => copyHash(uploadProgress.verifiedMetadata.sha256)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {copiedSha ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSha ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] p-2 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 break-all select-all">
                    {uploadProgress.verifiedMetadata.sha256}
                  </div>
                </div>

                {downloadNotice && (
                  <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>{downloadNotice}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        resetUploadProgress();
                        setSelectedFile(null);
                        setAppTitle('');
                        setReleaseNotes('');
                        setDownloadNotice(null);
                      }}
                      className="text-xs text-neutral-600 dark:text-neutral-400 hover:underline cursor-pointer"
                    >
                      Upload Another Package
                    </button>
                    <button
                      onClick={handleTestDownload}
                      disabled={isDownloadingTest}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isDownloadingTest ? 'Preparing...' : 'Test Download Binary'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const publishedId =
                        uploadProgress.verifiedMetadata?.appId || targetAppId;
                      if (publishedId) {
                        navigateTo('app-details', publishedId);
                      } else {
                        navigateTo('home');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>View Public Release</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
