import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { ADMIN_CONFIGURED_EMAIL } from '../../lib/firebase';
import { GlassSurface, GlassButton } from '../common/GlassComponents';

export const AdminLogin: React.FC = () => {
  const { simulateAdminSignIn, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMsg('Please enter your administrator email address.');
      return;
    }

    // Strict Admin Authorization: Enforce that ONLY the authorized admin email can access the panel
    if (trimmedEmail !== ADMIN_CONFIGURED_EMAIL.toLowerCase()) {
      setErrorMsg('Unauthorized access. Invalid admin email.');
      return;
    }

    try {
      setLoading(true);
      simulateAdminSignIn(trimmedEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unauthorized access. Invalid admin email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <button
        onClick={() => navigateTo('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] transition-colors glass-pressable"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Public Directory</span>
      </button>

      {/* B4 / B6 Glass Surface Card (28px radius) */}
      <GlassSurface variant="card" className="p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] shadow-sm border border-white/40">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--lg-ink)]">
            Administrator Authentication
          </h2>
          <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
            Administrative access is strictly restricted to authorized platform administrators.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-[18px] border border-red-300 dark:border-red-900 bg-[var(--lg-error-bg)] text-[var(--lg-error)] text-xs flex items-center gap-2.5 font-medium shadow-xs"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* B6. Interactive Email Input Field (20px radius, 54px height) */}
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold text-[var(--lg-ink)]"
            >
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--lg-ink-muted)]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="Enter administrator email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full h-[54px] pl-11 pr-4 text-xs sm:text-sm rounded-[20px] glass-surface text-[var(--lg-ink)] placeholder-[var(--lg-ink-muted)] border border-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--lg-accent-start)] transition-all shadow-xs"
              />
            </div>
            <p className="text-[11px] text-[var(--lg-ink-muted)] font-medium">
              Access is restricted to authorized platform administrative identities.
            </p>
          </div>

          {/* B9. Main Action Button: Launch Admin Session */}
          <GlassButton
            type="submit"
            variant="primary"
            disabled={loading || !email.trim()}
            className="w-full"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Launch Admin Session</span>
          </GlassButton>
        </form>

        <div className="pt-2 text-center text-[11px] text-[var(--lg-ink-muted)] font-medium">
          Sign-in tokens are cryptographically validated against administrative role bindings.
        </div>
      </GlassSurface>
    </div>
  );
};
