import React, { useState } from 'react';
import { useAds } from '../../context/AdContext';
import { Shield, Info, ExternalLink, X, Star } from 'lucide-react';

export const AdMobBannerDemo: React.FC = () => {
  const { isBannerVisible, setBannerVisible } = useAds();
  const [showInfo, setShowInfo] = useState<boolean>(false);

  if (!isBannerVisible) return null;

  return (
    <div
      id="admob-anchored-banner-demo"
      className="w-full px-4 sm:px-6 lg:px-8 py-2 transition-all duration-300"
    >
      {/* Required Code Placement Script Tag */}
      <div
        dangerouslySetInnerHTML={{
          __html: '<script> <!-- Initialize AdMob Anchored Adaptive Banner Demo Ad with ID: ca-app-pub-3940256099942544/9214589741 --> </script>',
        }}
      />

      {/* Anchored Adaptive Banner Container */}
      <div className="mx-auto max-w-4xl relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md shadow-xs transition-colors">
        {/* Top test ad watermark bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-neutral-200/50 dark:bg-neutral-800/50 border-b border-white/20 dark:border-white/5 text-[10px] text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-neutral-950 font-extrabold px-1.5 py-0.2 rounded text-[9px] tracking-wider">
              Ad
            </span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Google AdMob Anchored Adaptive Banner • Demo
            </span>
            <span className="hidden sm:inline font-mono opacity-70">
              ID: ca-app-pub-3940256099942544/9214589741
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              title="AdMob Demo Info"
              className="p-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Info className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              title="Dismiss Demo Banner"
              className="p-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Ad Info Details (Collapsible) */}
        {showInfo && (
          <div className="px-4 py-2 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 text-[11px] text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span>
              Format: Anchored Adaptive Banner (320x50 / 728x90) • Unit ID: ca-app-pub-3940256099942544/9214589741
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">AdMob Demo Mode</span>
          </div>
        )}

        {/* Adaptive Banner Content */}
        <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Advertiser Logo */}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  CyberGuard VPN & Cloud Defense
                </h4>
                <div className="hidden md:flex items-center gap-0.5 text-[10px] text-amber-500 font-bold shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>4.8</span>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                Zero-logs encrypted Android proxy. 100+ countries with unlimited bandwidth.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 hidden lg:inline">
              Free Download
            </span>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Install</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
