import React from 'react';
import { useApp } from '../../context/AppContext';
import { Download } from 'lucide-react';
import { GlassSurface } from '../common/GlassComponents';

export const Footer: React.FC = () => {
  const { navigateTo, user, isAdmin } = useApp();

  return (
    <footer className="mt-12 w-full px-4 sm:px-6 lg:px-8 pb-8 transition-colors">
      <div className="mx-auto max-w-7xl">
        <GlassSurface
          variant="card"
          className="p-6 sm:p-8 rounded-[28px]"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand & Purpose */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 font-extrabold text-base text-[var(--lg-ink)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-xs">
                  <Download className="h-4 w-4" />
                </div>
                <span className="text-lg">AppDrop</span>
              </div>
              <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                Open and verified Android application distribution hub. Delivering direct APK downloads with structural integrity checks and signing certificate verification.
              </p>
            </div>

            {/* Application Directory */}
            <div className="space-y-3">
              <h4 className="font-bold text-[var(--lg-ink)] uppercase tracking-wider text-[11px]">
                Application Directory
              </h4>
              <ul className="space-y-2 text-xs font-medium text-[var(--lg-ink-muted)]">
                <li>
                  <button
                    onClick={() => navigateTo('home')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    All Applications
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('categories', null, 'Tools')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Tools & Security
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('categories', null, 'Productivity')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Productivity
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('categories', null, 'Personalization')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Launchers & Customization
                  </button>
                </li>
              </ul>
            </div>

            {/* Trust & Legal */}
            <div className="space-y-3">
              <h4 className="font-bold text-[var(--lg-ink)] uppercase tracking-wider text-[11px]">
                Trust & Legal
              </h4>
              <ul className="space-y-2 text-xs font-medium text-[var(--lg-ink-muted)]">
                <li>
                  <button
                    onClick={() => navigateTo('privacy')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('terms')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Terms of Distribution
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('about')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Verification Architecture
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('contact')}
                    className="hover:text-[var(--lg-ink)] transition-colors glass-pressable"
                  >
                    Security & Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo(user && isAdmin ? 'admin-dashboard' : 'admin-login')}
                    className="hover:text-[var(--lg-accent-start)] transition-colors text-left font-bold glass-pressable"
                    data-testid="footer-admin-portal"
                  >
                    Portal
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </GlassSurface>
      </div>
    </footer>
  );
};
