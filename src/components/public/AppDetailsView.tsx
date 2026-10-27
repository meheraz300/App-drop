import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { GlassSurface, GlassButton, GlassTag } from '../common/GlassComponents';
import { formatApkDownloadFileName } from '../../lib/downloadHelper';

export const AppDetailsView: React.FC = () => {
  const { apps, versions, selectedAppId, navigateTo, requestDownload } = useApp();

  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [iconError, setIconError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'versions'>('overview');

  const app = apps.find((a) => a.id === selectedAppId);

  if (!app) {
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

      const { downloadUrl, fileName } = await requestDownload(app.id, versionId);

      // Finish progress animation
      clearInterval(progressTimer);
      setDownloadProgress(100);

      // Slight delay so the user clearly sees 100% completion before file triggers
      setTimeout(() => {
        const targetVer = appVersions.find((v) => v.id === versionId);
        const resolvedFileName =
          fileName || formatApkDownloadFileName(app.name, targetVer?.versionName);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = resolvedFileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

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

            {/* Note: Download count text has been removed as requested */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[var(--lg-ink-muted)] font-medium">
              <Calendar className="h-3.5 w-3.5 text-[var(--lg-ink-muted)]" />
              <span>Updated {formattedDate}</span>
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
            <div className="text-[11px] text-[var(--lg-ink-muted)] text-center md:text-right font-medium">
              <span>Latest: </span>
              <span className="font-mono font-bold text-[var(--lg-ink)]">
                v{latestVersion.versionName}
              </span>{' '}
              <span className="font-mono opacity-80">(code {latestVersion.versionCode})</span>
            </div>
          )}
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
    </div>
  );
};
