import React, { useEffect, useState } from 'react';
import { useAds } from '../../context/AdContext';
import { Sparkles, ArrowRight, ShieldCheck, Star, ExternalLink, X } from 'lucide-react';

export const AdMobAppOpenDemo: React.FC = () => {
  const { isAppOpenAdVisible, closeAppOpenAd } = useAds();
  const [countdown, setCountdown] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(true);

  // Auto-countdown timer on load
  useEffect(() => {
    if (!isAppOpenAdVisible) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAppOpenAdVisible]);

  return (
    <div
      id="admob-app-open-demo"
      className={isAppOpenAdVisible ? 'fixed inset-0 z-[100] flex flex-col justify-between bg-black/85 backdrop-blur-2xl text-white p-4 sm:p-8 animate-in fade-in duration-300' : 'hidden'}
    >
      {/* Required Code Placement Script Tag */}
      <div
        dangerouslySetInnerHTML={{
          __html: '<script> <!-- Initialize AdMob App Open Demo Ad with ID: ca-app-pub-3940256099942544/9257395921 --> </script>',
        }}
      />

      {isAppOpenAdVisible && (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full justify-between py-2">
          {/* Top Bar with AdMob Test Ad Badge and Skip/Continue control */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400/90 text-neutral-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                    Ad
                  </span>
                  <span className="text-xs font-bold tracking-wide text-neutral-200">
                    Google AdMob • Test Ad
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">
                  ID: ca-app-pub-3940256099942544/9257395921
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                {countdown > 0 ? (
                  <span>Auto-close in {countdown}s</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">Ready to enter</span>
                )}
              </div>

              <button
                type="button"
                onClick={closeAppOpenAd}
                data-testid="admob-app-open-skip-btn"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold border border-white/20 text-white shadow-sm cursor-pointer"
              >
                <span>Continue to App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Center Stage: High-Impact App Open Creative Showcase */}
          <div className="my-auto py-6 sm:py-10 max-w-2xl mx-auto w-full text-center space-y-6">
            <div className="relative inline-block mx-auto">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-2xl mx-auto flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="h-full w-full bg-neutral-950/70 rounded-[22px] flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-12 w-12 text-pink-400 animate-pulse" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg">
                FEATURED
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Apex Nova Launcher 2026
              </h2>
              <p className="text-neutral-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Supercharge your Android device with lightning-fast 120 FPS fluid navigation, intelligent widgets, and customizable liquid themes.
              </p>
            </div>

            {/* Social Proof Tags */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-300">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">4.9 / 5.0</span>
                <span className="text-neutral-400 text-[11px]">(480K reviews)</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Verified Safe APK</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-full border border-white/15 font-mono text-[11px]">
                10M+ Downloads
              </div>
            </div>

            {/* Simulated CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={closeAppOpenAd}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Install from Play Store</span>
                <ExternalLink className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={closeAppOpenAd}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer"
              >
                Dismiss & Open AppDrop
              </button>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span>AdMob App Open Demo Format</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-neutral-500">AdUnit: 9257395921</span>
            </span>
            <span className="text-neutral-500">
              Triggered on initial page launch
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
