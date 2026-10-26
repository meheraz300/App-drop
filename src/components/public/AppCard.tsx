import React from 'react';
import type { AppRecord, VersionRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, HardDrive, ShieldCheck } from 'lucide-react';
import { GlassSurface, GlassTag } from '../common/GlassComponents';

interface AppCardProps {
  app: AppRecord;
  latestVersion?: VersionRecord;
  downloadCount?: number;
}

export const AppCard: React.FC<AppCardProps> = ({ app, latestVersion }) => {
  const { navigateTo } = useApp();
  const [imgError, setImgError] = React.useState(false);

  const formattedSize = latestVersion?.apkSizeBytes
    ? `${(latestVersion.apkSizeBytes / (1024 * 1024)).toFixed(1)} MB`
    : 'APK';

  const updatedDate = app.updatedAt
    ? new Date(app.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <GlassSurface
      variant="card"
      isInteractive
      onClick={() => navigateTo('app-details', app.id)}
      className="p-5 flex flex-col justify-between group cursor-pointer transition-all duration-200 hover:shadow-[0_12px_14px_rgba(var(--lg-shadow-color),0.26)] rounded-[24px]"
    >
      <div className="space-y-3">
        {/* Top Header: Small, perfectly scaled app icon + Identity */}
        <div className="flex items-start gap-3.5">
          {/* Small, perfectly scaled app icon container */}
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-[16px] bg-white/40 dark:bg-white/10 border border-white/50 dark:border-white/20 shadow-xs shrink-0 overflow-hidden flex items-center justify-center p-1 backdrop-blur-xs">
            {!imgError && app.iconPath ? (
              <img
                src={app.iconPath}
                alt={`${app.name} icon`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-[12px]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-[12px] bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] flex items-center justify-center text-[var(--lg-on-accent)] font-extrabold text-lg sm:text-xl shadow-xs">
                {app.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-bold text-[var(--lg-ink)] text-base sm:text-lg leading-snug truncate group-hover:text-[var(--lg-accent-start)] transition-colors">
                {app.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-[var(--lg-ink-muted)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--lg-ink-muted)]">
              <GlassTag variant="neutral">{app.category}</GlassTag>
              {latestVersion && (
                <span className="font-mono text-[11px] font-semibold text-[var(--lg-ink-muted)]">
                  v{latestVersion.versionName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-[var(--lg-ink-muted)] line-clamp-2 leading-relaxed">
          {app.shortDescription}
        </p>
      </div>

      {/* Card Footer: Size & Verified Tag */}
      <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[var(--lg-ink)]">
          <HardDrive className="h-3.5 w-3.5 text-[var(--lg-ink-muted)]" />
          <span>{formattedSize}</span>
          <span className="text-[var(--lg-ink-muted)] font-normal ml-1">· {updatedDate}</span>
        </div>

        <GlassTag variant={app.featured ? 'info' : 'success'}>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>{app.featured ? 'Featured' : 'Verified'}</span>
          </span>
        </GlassTag>
      </div>
    </GlassSurface>
  );
};
