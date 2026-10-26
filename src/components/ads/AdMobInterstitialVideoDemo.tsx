import React, { useEffect, useState, useRef } from 'react';
import { useAds } from '../../context/AdContext';
import { Play, Pause, Volume2, VolumeX, X, CheckCircle2, Download, Gamepad2, Star, Sparkles } from 'lucide-react';

export const AdMobInterstitialVideoDemo: React.FC = () => {
  const { isInterstitialVisible, closeInterstitialVideo } = useAds();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const TOTAL_DURATION = 5; // 5 seconds demo ad

  // Reset and initialize when the interstitial is triggered
  useEffect(() => {
    if (!isInterstitialVisible) {
      setProgress(0);
      setCurrentTime(0);
      setHasFinished(false);
      setIsPlaying(true);
      return;
    }

    setProgress(0);
    setCurrentTime(0);
    setHasFinished(false);
    setIsPlaying(true);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= TOTAL_DURATION) {
        setProgress(100);
        setCurrentTime(TOTAL_DURATION);
        setHasFinished(true);
        clearInterval(interval);
      } else {
        setCurrentTime(elapsed);
        setProgress((elapsed / TOTAL_DURATION) * 100);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isInterstitialVisible]);

  // Dynamic canvas animation for simulated gameplay demo
  useEffect(() => {
    if (!isInterstitialVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const render = () => {
      tick++;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 640);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 360);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#311042');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Speed grid / horizon effect
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.lineWidth = 1;
      const horizon = h * 0.55;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(w / 2, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Animated ground grid lines moving forward
      const speed = (tick * 4) % 40;
      for (let y = horizon; y < h; y += 25) {
        const lineY = y + speed;
        if (lineY <= h) {
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(w, lineY);
          ctx.stroke();
        }
      }

      // Neon glowing cyber runner / vehicle simulation
      const carX = w / 2 + Math.sin(tick * 0.05) * 60;
      const carY = h * 0.75;

      // Glow behind car
      const glow = ctx.createRadialGradient(carX, carY, 5, carX, carY, 50);
      glow.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
      glow.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(carX, carY, 50, 0, Math.PI * 2);
      ctx.fill();

      // Vehicle polygon
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(carX, carY - 20);
      ctx.lineTo(carX + 25, carY + 15);
      ctx.lineTo(carX - 25, carY + 15);
      ctx.closePath();
      ctx.fill();

      // Audio waveform equalizer simulation
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      const bars = 24;
      const barWidth = 6;
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.sin(tick * 0.1 + i) * 18 + 22;
        ctx.fillRect(w - 180 + i * 7, 30 - barHeight / 2, barWidth, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInterstitialVisible]);

  return (
    <div
      id="admob-interstitial-video-demo"
      className={
        isInterstitialVisible
          ? 'fixed inset-0 z-[120] flex flex-col justify-between bg-black/95 backdrop-blur-2xl text-white p-3 sm:p-6 select-none animate-in fade-in duration-200'
          : 'hidden'
      }
    >
      {/* Required Code Placement Script Tag */}
      <div
        dangerouslySetInnerHTML={{
          __html: '<script> <!-- Initialize AdMob Interstitial Video Demo Ad with ID: ca-app-pub-3940256099942544/1033173712 --> </script>',
        }}
      />

      {isInterstitialVisible && (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full justify-between">
          {/* Top Bar: AdMob Status + Timer / Cross (X) Close Button */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="bg-yellow-400 text-neutral-950 font-extrabold px-1.5 py-0.5 rounded text-[10px] tracking-wide shrink-0">
                Ad
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-neutral-100 truncate">
                    Google AdMob Interstitial Video Demo
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 block truncate">
                  ID: ca-app-pub-3940256099942544/1033173712
                </span>
              </div>
            </div>

            {/* Countdown or Cross (X) Close Button */}
            <div className="flex items-center gap-3 shrink-0">
              {!hasFinished ? (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-xs font-mono">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Video playing: {Math.max(1, TOTAL_DURATION - Math.floor(currentTime))}s</span>
                </div>
              ) : (
                /* Cross (X) button appears after video plays! Closing it triggers the APK download workflow. */
                <button
                  type="button"
                  onClick={closeInterstitialVideo}
                  data-testid="admob-interstitial-close-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 border border-emerald-400/50 transition-all cursor-pointer animate-pulse"
                >
                  <X className="h-4 w-4" />
                  <span>Close & Download APK</span>
                </button>
              )}
            </div>
          </div>

          {/* Video Player Display */}
          <div className="my-auto py-4 max-w-4xl mx-auto w-full">
            <div className="relative aspect-16/9 rounded-3xl overflow-hidden border border-white/20 bg-neutral-950 shadow-2xl flex flex-col justify-between">
              {/* Animated Canvas Simulated 60 FPS Video */}
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

              {/* Video Overlay Branding */}
              <div className="relative z-10 p-4 sm:p-6 flex items-start justify-between pointer-events-none">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                    <Gamepad2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white tracking-wide">
                      CyberRacer 2026: Neon Drive
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>4.9 ★ • Next-Gen Mobile Racing</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[11px] text-neutral-300">
                  <Sparkles className="h-3 w-3 text-pink-400" />
                  <span>60 FPS Demo Stream</span>
                </div>
              </div>

              {/* End Card Overlay (Shows when video completes) */}
              {hasFinished && (
                <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-extrabold text-white">Video Ad Complete!</h4>
                    <p className="text-xs sm:text-sm text-neutral-300 max-w-sm">
                      Closing this interstitial will now immediately launch the verified APK download.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeInterstitialVideo}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Proceed to APK Download (Close Ad)</span>
                  </button>
                </div>
              )}

              {/* Video Bottom Scrubber & Controls */}
              <div className="relative z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2">
                {/* Progress Scrubber */}
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1 hover:text-white transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 hover:text-white transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <span className="font-mono text-[11px]">
                      0:0{Math.min(TOTAL_DURATION, Math.floor(currentTime))} / 0:0{TOTAL_DURATION}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400">
                      Format: Full-screen Interstitial Video
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-neutral-400">
            <span>
              Triggered by <span className="font-semibold text-neutral-300">"Download APK"</span> button action
            </span>
            <span className="text-neutral-500">
              AdMob Demo Unit ID: ca-app-pub-3940256099942544/1033173712
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
