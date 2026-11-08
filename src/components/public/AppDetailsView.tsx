import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Smartphone,
  HelpCircle,
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { GlassSurface, GlassButton, GlassTag } from '../common/GlassComponents';
import { formatApkDownloadFileName, estimateDownloadDuration } from '../../lib/downloadHelper';
import { MobileInstallAssistantModal } from './MobileInstallAssistantModal';
import { type InstallIssueType } from '../../lib/mobileInstallHelper';

export const AppDetailsView: React.FC = () => {
  const { apps, versions, downloadStats, selectedAppId, navigateTo, requestDownload, isInitialSyncLoading } = useApp();

  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'versions'>('overview');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPostDownloadCard, setShowPostDownloadCard] = useState(false);
  const [initialModalIssue, setInitialModalIssue] = useState<InstallIssueType | undefined>(undefined);
  const [lastDownloadInfo, setLastDownloadInfo] = useState<{
    fileName: string;
    directServerUrl?: string;
  } | null>(null);

  const app = apps.find((a) => a.id === selectedAppId);

  if (!app) {
    if (isInitialSyncLoading) {
      return (
        <div className="py-20 text-center space-y-4 max-w-lg mx-auto">
          <GlassSurface variant="card" className="p-8 space-y-4 text-center rounded-[28px]">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--lg-accent-start)]" />
            <h2 className="text-lg font-bold text-[var(--lg-ink)]">Retrieving Application Details...</h2>
            <p className="text-sm text-[var(--lg-ink-muted)]">
              Fetching verified release metadata from the public Firestore repository in real-time.
            </p>
          </GlassSurface>
        </div>
      );
    }

    return (
      <div className="py-20 text-center space-y-4 max-w-lg mx-auto">
        <GlassSurface variant="card" className="p-8 space-y-4 text-center rounded-[28px]">
          <h2 className="text-xl font-extrabold text-[var(--lg-ink)]">Application Not Found</h2>
          <p className="text-sm text-[var(--lg-ink-muted)]">
            The requested application does not exist or has been unpublished.
          </p>
          <div className="pt-2">
            <GlassButton variant="primary" onClick={() => navigateTo('home')}>
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </GlassButton>
          </div>
        </GlassSurface>
      </div>
    );
  }

  // Published versions for this app
  const appVersions = versions
    .filter((v) => v.appId === app.id && v.status === 'published')
    .sort((a, b) => b.versionCode - a.versionCode);

  const latestVersion = appVersions.find((v) => v.id === app.latestPublishedVersionId) || appVersions[0];

  const executeDownload = async (versionId: string) => {
    try {
      setDownloadError(null);
      setDownloadingVersionId(versionId);
      setDownloadProgress(8);

      // Smooth progress animation incrementing towards completion
      const progressTimer = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 92) return prev;
          const jump = Math.floor(Math.random() * 14) + 8;
          return Math.min(prev + jump, 92);
        });
      }, 160);

      const { downloadUrl, fileName, directServerUrl } = await requestDownload(app.id, versionId);

      // Finish progress animation
      clearInterval(progressTimer);
      setDownloadProgress(100);

      // Slight delay so the user clearly sees 100% completion before file triggers
      setTimeout(() => {
        const targetVer = appVersions.find((v) => v.id === versionId);
        const resolvedFileName =
          fileName || formatApkDownloadFileName(app.name, targetVer?.versionName);
        setLastDownloadInfo({ fileName: resolvedFileName, directServerUrl });

        // Trigger direct server stream so Android DownloadManager receives exact binary headers
        const downloadLink = directServerUrl || downloadUrl;
        const anchor = document.createElement('a');
        anchor.href = downloadLink;
        anchor.download = resolvedFileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Show helpful mobile installation guidance
        setShowPostDownloadCard(true);

        // Reset state after completion display
        setTimeout(() => {
          setDownloadingVersionId(null);
          setDownloadProgress(0);
        }, 900);
      }, 350);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to initialize download.');
      setDownloadingVersionId(null);
      setDownloadProgress(0);
    }
  };

  const handleDownload = (versionId: string) => {
    executeDownload(versionId);
  };

  const formattedDate = app.updatedAt
    ? new Date(app.updatedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const formattedSize = latestVersion?.apkSizeBytes
    ? `${(latestVersion.apkSizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : 'APK';

  const appDownloads = downloadStats
    ? downloadStats
        .filter((s) => s.appId === app.id)
        .reduce((sum, s) => sum + (s.requestCount || (s as any).downloads || 0), 0)
    : 0;

  const estDuration = estimateDownloadDuration(latestVersion?.apkSizeBytes || 0);

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-10 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigateTo('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] transition-colors glass-pressable"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Applications</span>
      </button>

      {/* Download Error Banner */}
      {downloadError && (
        <div className="p-4 rounded-[20px] border border-red-300 dark:border-red-900 bg-[var(--lg-error-bg)] text-[var(--lg-error)] text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mandatory Update Banner */}
      {app.mandatoryUpdate && (
        <div className="p-4 rounded-[20px] border border-red-300 dark:border-red-900 bg-[var(--lg-error-bg)] text-[var(--lg-error)] text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Mandatory Update Required</h4>
            <p className="leading-relaxed">
              This application has a mandatory update policy enabled. Users on versions older than{' '}
              <span className="font-mono font-bold">
                code {app.minimumSupportedVersionCode || latestVersion?.versionCode}
              </span>{' '}
              must upgrade to the latest release to retain service connectivity.
            </p>
          </div>
        </div>
      )}

      {/* Post-Download Mobile Installation Guidance Strip */}
      {showPostDownloadCard && (
        <div className="p-4 sm:p-5 rounded-[24px] border border-[var(--lg-accent-start)]/40 bg-[var(--lg-accent-start)]/10 text-[var(--lg-ink)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span>APK Download Started! Follow these 3 steps to install on Android:</span>
            </div>
            <button
              onClick={() => setShowPostDownloadCard(false)}
              className="text-xs text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/40 dark:bg-white/10 border border-white/30 space-y-1">
              <span className="font-extrabold text-[var(--lg-accent-start)]">1. Open File</span>
              <p className="text-[var(--lg-ink-muted)] leading-relaxed">
                Tap the download complete notification, or open phone's <b>Files</b> &gt; <b>Downloads</b>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/40 dark:bg-white/10 border border-white/30 space-y-1">
              <span className="font-extrabold text-[var(--lg-accent-start)]">2. Allow Unknown Apps</span>
              <p className="text-[var(--lg-ink-muted)] leading-relaxed">
                If blocked by security, tap <b>Settings</b> &gt; turn ON <b>Allow from this source</b>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/40 dark:bg-white/10 border border-white/30 space-y-1">
              <span className="font-extrabold text-[var(--lg-accent-start)]">3. Tap Install</span>
              <p className="text-[var(--lg-ink-muted)] leading-relaxed">
                Press Back and tap <b>Install</b>. If Play Protect warns, tap <b>More details</b> &gt; <b>Install anyway</b>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--lg-accent-start)]/20">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[var(--lg-ink-muted)]">
                Downloaded: <b>{lastDownloadInfo?.fileName}</b>
              </span>
              {lastDownloadInfo?.directServerUrl && (
                <a
                  href={lastDownloadInfo.directServerUrl}
                  download={lastDownloadInfo.fileName}
                  className="text-[11px] font-semibold text-[var(--lg-accent-start)] hover:underline inline-flex items-center gap-1 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-lg border border-white/20"
                >
                  <Download className="h-3 w-3" />
                  <span>Direct HTTP Link</span>
                </a>
              )}
            </div>
            <button
              onClick={() => {
                setInitialModalIssue(undefined);
                setShowInstallModal(true);
              }}
              className="text-xs font-bold text-[var(--lg-accent-start)] hover:underline inline-flex items-center gap-1"
            >
              <span>Installation Troubleshooter</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Main Hero Strip */}
      <GlassSurface variant="card" className="p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 rounded-[28px]">
        <div className="flex items-start gap-5">
          {/* Scaled app icon */}
          {!iconError && app.iconPath ? (
            <img
              src={app.iconPath}
              alt={`${app.name} app icon`}
              referrerPolicy="no-referrer"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] object-contain bg-white/20 dark:bg-white/10 border border-white/40 shadow-sm shrink-0 p-1"
              onError={() => setIconError(true)}
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] flex items-center justify-center text-[var(--lg-on-accent)] font-extrabold text-2xl sm:text-3xl shadow-sm border border-white/40 shrink-0">
              {app.name.charAt(0)}
            </div>
          )}

          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--lg-ink)]">
              {app.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <GlassTag variant="info">{app.category}</GlassTag>
              <span className="font-mono text-[var(--lg-ink-muted)]">{app.packageName}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--lg-ink-muted)] font-medium">
              <div className="flex items-center gap-1.5" title="Total downloads">
                <Download className="h-3.5 w-3.5 text-[var(--lg-accent-start)]" />
                <span className="font-semibold text-[var(--lg-ink)]">{appDownloads} downloads</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5" title="Estimated download duration">
                <Clock className="h-3.5 w-3.5 text-[var(--lg-accent-start)]" />
                <span>Est. time: {estDuration.summary}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--lg-ink-muted)]" />
                <span>Updated {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button with Visual Progress Bar & Percentage */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
          {latestVersion ? (
            <GlassButton
              variant="primary"
              onClick={() => handleDownload(latestVersion.id)}
              disabled={downloadingVersionId === latestVersion.id}
              className="relative overflow-hidden min-w-[250px] sm:min-w-[270px] h-[58px]"
            >
              {downloadingVersionId === latestVersion.id ? (
                <>
                  {/* Visual Progress Bar Fill spanning the button surface */}
                  <div
                    className="absolute inset-0 bg-white/25 dark:bg-white/20 transition-all duration-200 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />

                  {/* High-visibility bottom glowing progress indicator track */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/25">
                    <div
                      className="h-full bg-white transition-all duration-200 ease-out shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>

                  {/* Button Content: Spinner / Check + Status + Percentage */}
                  <div className="relative z-10 flex items-center justify-between w-full px-1 gap-3 text-[var(--lg-on-accent)]">
                    <div className="flex items-center gap-2">
                      {downloadProgress >= 100 ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-white animate-bounce" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      <span className="font-bold text-sm">
                        {downloadProgress >= 100 ? 'Ready!' : 'Downloading APK...'}
                      </span>
                    </div>

                    <span className="font-mono font-extrabold text-xs bg-white/25 px-2.5 py-0.5 rounded-full border border-white/40 tabular-nums">
                      {downloadProgress}%
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download APK ({formattedSize})</span>
                </>
              )}
            </GlassButton>
          ) : (
            <div className="text-xs text-[var(--lg-ink-muted)] italic py-2">No published APK version available</div>
          )}

          {latestVersion && (
            <div className="text-[11px] text-[var(--lg-ink-muted)] text-center md:text-right font-medium space-y-0.5">
              <div>
                <span>Latest: </span>
                <span className="font-mono font-bold text-[var(--lg-ink)]">
                  v{latestVersion.versionName}
                </span>{' '}
                <span className="font-mono opacity-80">(code {latestVersion.versionCode})</span>
              </div>
              <div className="text-[10px] text-[var(--lg-ink-muted)] opacity-90">
                <span>Est. {estDuration.wifi5g} on 5G/Wi-Fi · {estDuration.lte4g} on 4G</span>
              </div>
            </div>
          )}

          {/* Direct Mobile Installation Help Trigger */}
          <button
            onClick={() => {
              setInitialModalIssue(undefined);
              setShowInstallModal(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--lg-accent-start)] hover:underline glass-pressable py-1"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Can't install on your mobile? Tap for fix</span>
          </button>
        </div>
      </GlassSurface>

      {/* Tabs navigation */}
      <div className="inline-flex p-1.5 rounded-full glass-surface">
        <button
          onClick={() => setActiveTab('overview')}
          className={`h-[46px] px-6 rounded-full text-xs font-bold transition-all glass-pressable ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-sm'
              : 'text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
          }`}
        >
          Overview & Media
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`h-[46px] px-6 rounded-full text-xs font-bold transition-all glass-pressable ${
            activeTab === 'versions'
              ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-sm'
              : 'text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
          }`}
        >
          Version History ({appVersions.length})
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Screenshots Gallery */}
          {app.screenshotPaths && app.screenshotPaths.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--lg-ink-muted)]">
                Interface Previews
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {app.screenshotPaths.map((shot, idx) => (
                  <div
                    key={idx}
                    className="relative shrink-0 w-64 sm:w-80 aspect-16/10 rounded-[18px] overflow-hidden border border-white/40 glass-surface shadow-xs"
                  >
                    <img
                      src={shot}
                      alt={`${app.name} preview screenshot ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Release Notes for Current Build */}
          {latestVersion && latestVersion.releaseNotes && (
            <GlassSurface variant="card" className="p-6 space-y-3 rounded-[24px]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--lg-ink)]">
                  What's New in v{latestVersion.versionName}
                </h3>
                <span className="text-xs text-[var(--lg-ink-muted)] font-medium">
                  {latestVersion.publishedAt
                    ? new Date(latestVersion.publishedAt).toLocaleDateString()
                    : 'Recent'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--lg-ink-muted)] whitespace-pre-line leading-relaxed">
                {latestVersion.releaseNotes}
              </p>
            </GlassSurface>
          )}

          {/* Description */}
          <GlassSurface variant="card" className="p-6 space-y-3 rounded-[24px]">
            <h3 className="text-base font-bold text-[var(--lg-ink)]">About This Application</h3>
            <p className="text-sm text-[var(--lg-ink-muted)] leading-relaxed whitespace-pre-line">
              {app.description || app.shortDescription}
            </p>
          </GlassSurface>

          {/* Mobile Installation & Compatibility Card */}
          <GlassSurface variant="card" className="p-6 space-y-4 rounded-[24px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-5 w-5 text-[var(--lg-accent-start)]" />
                <h3 className="text-base font-bold text-[var(--lg-ink)]">
                  Mobile Installation &amp; Compatibility
                </h3>
              </div>
              <GlassTag variant="info">Android APK</GlassTag>
            </div>

            <p className="text-xs sm:text-sm text-[var(--lg-ink-muted)] leading-relaxed">
              Downloaded this app on your phone and can't install it? Android requires a one-time permission to install apps downloaded from web browsers. Select your issue for the instant fix:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setInitialModalIssue('unknown_sources');
                  setShowInstallModal(true);
                }}
                className="p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/20 hover:border-[var(--lg-accent-start)]/50 cursor-pointer transition-all space-y-1 group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--lg-ink)] group-hover:text-[var(--lg-accent-start)] transition-colors">
                    1. "Phone not allowed to install"
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--lg-ink-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-[var(--lg-ink-muted)] leading-relaxed">
                  Tap Settings &gt; enable "Allow from this source" for Chrome / Files.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialModalIssue('play_protect');
                  setShowInstallModal(true);
                }}
                className="p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/20 hover:border-[var(--lg-accent-start)]/50 cursor-pointer transition-all space-y-1 group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--lg-ink)] group-hover:text-[var(--lg-accent-start)] transition-colors">
                    2. "Blocked by Play Protect"
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--lg-ink-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-[var(--lg-ink-muted)] leading-relaxed">
                  Tap "More details" dropdown &gt; select "Install anyway".
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialModalIssue('cant_open_file');
                  setShowInstallModal(true);
                }}
                className="p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/20 hover:border-[var(--lg-accent-start)]/50 cursor-pointer transition-all space-y-1 group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--lg-ink)] group-hover:text-[var(--lg-accent-start)] transition-colors">
                    3. "Can't open file"
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--lg-ink-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-[var(--lg-ink-muted)] leading-relaxed">
                  Open phone's built-in "Files" or "My Files" app &gt; Downloads &gt; tap APK.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialModalIssue('parse_error');
                  setShowInstallModal(true);
                }}
                className="p-3.5 rounded-2xl bg-white/20 dark:bg-white/5 border border-white/20 hover:border-[var(--lg-accent-start)]/50 cursor-pointer transition-all space-y-1 group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--lg-ink)] group-hover:text-[var(--lg-accent-start)] transition-colors">
                    4. "Problem parsing package"
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--lg-ink-muted)] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-[var(--lg-ink-muted)] leading-relaxed">
                  Re-download complete file or ensure filename ends with .apk.
                </p>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--lg-ink-muted)] font-mono">
                Package: {app.packageName}
              </span>
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setInitialModalIssue(undefined);
                  setShowInstallModal(true);
                }}
                className="h-9 px-4 text-xs font-bold"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Open Full Mobile Troubleshooter</span>
              </GlassButton>
            </div>
          </GlassSurface>
        </div>
      )}

      {/* Tab Content: Version History */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          {appVersions.length === 0 ? (
            <GlassSurface variant="card" className="p-8 text-center text-xs text-[var(--lg-ink-muted)] rounded-[24px]">
              No historical releases recorded for this application.
            </GlassSurface>
          ) : (
            appVersions.map((v) => {
              const isCurrent = v.id === latestVersion?.id;
              const vDate = v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : 'Unpublished';
              const vSize = `${(v.apkSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
              const isDownloadingThis = downloadingVersionId === v.id;

              return (
                <GlassSurface
                  key={v.id}
                  variant="card"
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[24px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[var(--lg-ink)]">v{v.versionName}</span>
                      <span className="font-mono text-xs text-[var(--lg-ink-muted)]">code {v.versionCode}</span>
                      {isCurrent && <GlassTag variant="success">Current Release</GlassTag>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--lg-ink-muted)]">
                      <span>{vDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{vSize}</span>
                    </div>
                    {v.releaseNotes && (
                      <p className="text-xs text-[var(--lg-ink-muted)] whitespace-pre-line pt-1">
                        {v.releaseNotes}
                      </p>
                    )}
                  </div>

                  <GlassButton
                    variant="secondary"
                    onClick={() => handleDownload(v.id)}
                    disabled={isDownloadingThis}
                    className="relative overflow-hidden h-11 px-5 text-xs self-end sm:self-auto shrink-0 min-w-[130px]"
                  >
                    {isDownloadingThis ? (
                      <>
                        <div
                          className="absolute inset-0 bg-[var(--lg-accent-start)]/20 transition-all duration-200 ease-out"
                          style={{ width: `${downloadProgress}%` }}
                        />
                        <div className="relative z-10 flex items-center gap-2 font-bold text-[var(--lg-ink)]">
                          {downloadProgress >= 100 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--lg-success)]" />
                          ) : (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--lg-accent-start)]" />
                          )}
                          <span>{downloadProgress}%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </>
                    )}
                  </GlassButton>
                </GlassSurface>
              );
            })
          )}
        </div>
      )}

      {/* Mobile Installation Assistant & Troubleshooting Modal */}
      <MobileInstallAssistantModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        appName={app.name}
        versionName={latestVersion?.versionName}
        apkSizeMb={formattedSize}
        onRedownload={() => latestVersion && handleDownload(latestVersion.id)}
        initialIssue={initialModalIssue}
      />
    </div>
  );
};
