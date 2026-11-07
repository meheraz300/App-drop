import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Database,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const QuotaNoticeBanner: React.FC = () => {
  const { quotaStatus } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!quotaStatus.isExceeded || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Firestore free quota notice"
      className="relative z-40 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md text-amber-950 dark:text-amber-100 transition-all duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Firestore Spark Quota Notice:
              </span>{' '}
              <span className="text-amber-800/90 dark:text-amber-300/90">
                Daily free write quota reached on free-tier database. Offline cache & server binary storage are keeping AppDrop 100% operational.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
            <a
              href={quotaStatus.upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 transition-colors shadow-xs"
            >
              <span>Upgrade Database</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer"
              title="Show quota details"
            >
              <span>{isExpanded ? 'Less' : 'Details'}</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 hover:bg-amber-500/15 transition-colors cursor-pointer"
              title="Dismiss for this session"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded Technical & Quota Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-900/90 dark:text-amber-200/90 space-y-2 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Quota Metric</span>
                </div>
                <p className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                  {quotaStatus.metric || 'Free daily write units per project'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Automatic Reset</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Resets every day at midnight Pacific Time (00:00 UTC-8).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <div className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Resilient Engine</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Local cache, IndexedDB, and server storage are intact.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <span className="text-amber-800/80 dark:text-amber-300/80">
                Database: <code className="px-1 py-0.5 rounded bg-amber-500/15 font-mono text-[10px]">ai-studio-appdropandroidap-18a8d25f-ed9f-45c2-bf2e-ade5b99e6fef</code>
              </span>
              <a
                href={quotaStatus.pricingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 hover:underline font-medium"
              >
                <span>View Firebase Spark Free Tier Limits & Pricing</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
