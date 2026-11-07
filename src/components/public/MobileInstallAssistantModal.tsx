import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  RefreshCw,
  CheckCircle,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { GlassSurface, GlassButton, GlassTag } from '../common/GlassComponents';
import {
  DEVICE_INSTRUCTIONS,
  TROUBLESHOOTING_GUIDES,
  detectDeviceBrand,
  type DeviceBrand,
  type InstallIssueType,
} from '../../lib/mobileInstallHelper';

interface MobileInstallAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  versionName?: string;
  apkSizeMb?: string;
  onRedownload?: () => void;
  initialIssue?: InstallIssueType;
}

export const MobileInstallAssistantModal: React.FC<MobileInstallAssistantModalProps> = ({
  isOpen,
  onClose,
  appName = 'Application',
  versionName,
  apkSizeMb,
  onRedownload,
  initialIssue,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'devices' | 'troubleshoot'>('quick');
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand>('samsung');
  const [selectedIssueId, setSelectedIssueId] = useState<InstallIssueType>(
    initialIssue || 'unknown_sources'
  );
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Auto-detect brand on open
  useEffect(() => {
    if (isOpen) {
      const detected = detectDeviceBrand();
      setSelectedBrand(detected);
      if (initialIssue) {
        setSelectedIssueId(initialIssue);
        setActiveTab('troubleshoot');
      }
    }
  }, [isOpen, initialIssue]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDevice = DEVICE_INSTRUCTIONS[selectedBrand] || DEVICE_INSTRUCTIONS.generic;
  const currentGuide =
    TROUBLESHOOTING_GUIDES.find((g) => g.id === selectedIssueId) || TROUBLESHOOTING_GUIDES[0];

  const handleCopySteps = (steps: string[]) => {
    const text = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedStep(-1);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[28px] overflow-hidden shadow-2xl border border-white/30 glass-surface bg-[var(--lg-bg-card)]/95"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/20 dark:border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-sm shrink-0 border border-white/40">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="install-modal-title"
                  className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--lg-ink)]"
                >
                  Mobile Installation Helper
                </h2>
                <GlassTag variant="info">Android</GlassTag>
              </div>
              <p className="text-xs text-[var(--lg-ink-muted)] mt-0.5">
                Installing {appName} {versionName ? `v${versionName}` : ''} {apkSizeMb ? `(${apkSizeMb})` : ''} on mobile
              </p>
            </div>
          </div>

          <button
            aria-label="Close installation helper"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] hover:bg-white/20 dark:hover:bg-white/10 transition-colors glass-pressable"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 flex gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'quick'
                ? 'border-[var(--lg-accent-start)] text-[var(--lg-accent-start)]'
                : 'border-transparent text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
            }`}
          >
            3-Step Quick Install
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'troubleshoot'
                ? 'border-[var(--lg-accent-start)] text-[var(--lg-accent-start)]'
                : 'border-transparent text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <span>Fix Installation Errors</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-[var(--lg-accent-start)] text-[var(--lg-accent-start)]'
                : 'border-transparent text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
            }`}
          >
            By Phone Brand
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: 3-STEP QUICK GUIDE */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[20px] bg-[var(--lg-accent-start)]/10 border border-[var(--lg-accent-start)]/25 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-[var(--lg-accent-start)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--lg-ink)]">
                    Why does Android require permission?
                  </h4>
                  <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                    Apps downloaded from any website (outside Google Play) are called "unknown apps" by Android. This is normal Android security behavior. You only need to allow it once.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-[20px] bg-white/30 dark:bg-white/5 border border-white/30 flex items-start gap-3.5 shadow-xs">
                  <div className="h-7 w-7 rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] font-extrabold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-sm text-[var(--lg-ink)]">
                      Tap the Downloaded APK
                    </h4>
                    <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                      Pull down your phone's notification bar and tap the completed download notification, or tap "Open" at the bottom of Chrome.
                    </p>
                    <div className="text-[11px] text-[var(--lg-ink-muted)] bg-white/20 dark:bg-white/10 p-2 rounded-xl mt-1.5 flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 text-[var(--lg-accent-start)]" />
                      <span>If it says "Can't open file", open your phone's <b>Files</b> or <b>My Files</b> app &gt; <b>Downloads</b>.</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-[20px] bg-white/30 dark:bg-white/5 border border-white/30 flex items-start gap-3.5 shadow-xs">
                  <div className="h-7 w-7 rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] font-extrabold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-sm text-[var(--lg-ink)]">
                      Allow from this source
                    </h4>
                    <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                      When Android asks <i>"For your security, your phone is not allowed to install unknown apps"</i>, tap <b>Settings</b> and toggle <b>Allow from this source</b> to ON.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-[20px] bg-white/30 dark:bg-white/5 border border-white/30 flex items-start gap-3.5 shadow-xs">
                  <div className="h-7 w-7 rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] font-extrabold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-sm text-[var(--lg-ink)]">
                      Tap "Install" &amp; Complete
                    </h4>
                    <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                      Press your phone's Back button and tap <b>Install</b>. If Google Play Protect warns <i>"Unsafe app blocked"</i>, tap <b>More details</b> &gt; <b>Install anyway</b>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setActiveTab('troubleshoot')}
                  className="text-xs font-bold text-[var(--lg-accent-start)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Did you get a specific error? View exact fixes</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {onRedownload && (
                  <GlassButton variant="secondary" onClick={onRedownload} className="h-10 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Re-download APK</span>
                  </GlassButton>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TROUBLESHOOTING & ERROR FIXES */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--lg-ink-muted)]">
                  Select the issue or error message you see on your phone:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TROUBLESHOOTING_GUIDES.map((guide) => (
                    <button
                      key={guide.id}
                      onClick={() => setSelectedIssueId(guide.id)}
                      className={`p-3 rounded-[18px] text-left text-xs transition-all border ${
                        selectedIssueId === guide.id
                          ? 'bg-[var(--lg-accent-start)]/15 border-[var(--lg-accent-start)] text-[var(--lg-ink)] font-bold shadow-xs'
                          : 'bg-white/20 dark:bg-white/5 border-white/20 text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
                      }`}
                    >
                      <div className="font-bold truncate">{guide.title}</div>
                      <div className="text-[11px] opacity-75 truncate mt-0.5">{guide.symptom}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Diagnostic Details Card */}
              <GlassSurface variant="card" className="p-5 space-y-4 rounded-[22px] border border-white/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-[var(--lg-accent-start)]" />
                    <h3 className="font-extrabold text-base text-[var(--lg-ink)]">
                      {currentGuide.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--lg-ink-muted)] italic">
                    "{currentGuide.symptom}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/20 dark:bg-white/5 border border-white/20 text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                  {currentGuide.explanation}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--lg-ink)]">
                    Step-by-Step Fix:
                  </h4>
                  <ol className="space-y-2">
                    {currentGuide.solutionSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-[var(--lg-ink)] bg-white/30 dark:bg-white/5 p-2.5 rounded-xl border border-white/20"
                      >
                        <span className="h-5 w-5 rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {currentGuide.proTip && (
                  <div className="p-3 rounded-xl bg-[var(--lg-accent-start)]/10 border border-[var(--lg-accent-start)]/20 text-xs text-[var(--lg-ink)] flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--lg-accent-start)] shrink-0 mt-0.5" />
                    <span><b>Tip:</b> {currentGuide.proTip}</span>
                  </div>
                )}
              </GlassSurface>
            </div>
          )}

          {/* TAB 3: PHONE BRAND SPECIFIC SETTINGS */}
          {activeTab === 'devices' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--lg-ink-muted)]">
                  Choose your phone manufacturer:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(DEVICE_INSTRUCTIONS) as DeviceBrand[]).map((brandKey) => {
                    const inst = DEVICE_INSTRUCTIONS[brandKey];
                    return (
                      <button
                        key={brandKey}
                        onClick={() => setSelectedBrand(brandKey)}
                        className={`h-9 px-3.5 rounded-full text-xs font-bold transition-all border glass-pressable ${
                          selectedBrand === brandKey
                            ? 'bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] border-transparent shadow-xs'
                            : 'bg-white/20 dark:bg-white/5 border-white/20 text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)]'
                        }`}
                      >
                        {inst.brandName.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Card */}
              <GlassSurface variant="card" className="p-5 space-y-4 rounded-[22px] border border-white/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[var(--lg-ink)]">
                    {currentDevice.brandName}
                  </h3>
                  <button
                    onClick={() => handleCopySteps(currentDevice.steps)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--lg-accent-start)] font-bold hover:underline"
                  >
                    {copiedStep === -1 ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-[var(--lg-success)]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Steps</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white/20 dark:bg-white/5 border border-white/20 text-xs">
                  <span className="font-bold text-[var(--lg-ink)]">Settings Route: </span>
                  <span className="text-[var(--lg-ink-muted)] font-mono">{currentDevice.settingsPath}</span>
                </div>

                <ol className="space-y-2">
                  {currentDevice.steps.map((st, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-[var(--lg-ink)] bg-white/30 dark:bg-white/5 p-2.5 rounded-xl border border-white/20"
                    >
                      <span className="h-5 w-5 rounded-full bg-[var(--lg-accent-start)] text-[var(--lg-on-accent)] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed flex-1">{st}</span>
                    </li>
                  ))}
                </ol>

                {currentDevice.notes && (
                  <p className="text-xs text-[var(--lg-ink-muted)] italic pt-1">
                    <b>Note:</b> {currentDevice.notes}
                  </p>
                )}
              </GlassSurface>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/20 dark:border-white/10 flex items-center justify-between gap-3 bg-white/10 dark:bg-white/5">
          <div className="text-[11px] text-[var(--lg-ink-muted)]">
            Verified safe &bull; SHA-256 integrity protected
          </div>

          <GlassButton variant="primary" onClick={onClose} className="h-10 px-5 text-xs">
            <span>Got it, I'm Ready to Install</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
