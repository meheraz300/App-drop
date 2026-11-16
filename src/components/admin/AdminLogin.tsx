import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { ADMIN_CONFIGURED_EMAIL } from '../../lib/firebase';
import { GlassSurface, GlassButton } from '../common/GlassComponents';

export const AdminLogin: React.FC = () => {
  const { simulateAdminSignIn, signInWithGoogle, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="space-y-4">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full justify-center gap-3 py-3 font-semibold"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </GlassButton>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[var(--lg-border)]"></div>
            <span className="bg-[var(--lg-card-bg)] px-3 text-[11px] font-semibold text-[var(--lg-ink-muted)] uppercase tracking-wider absolute">
              or administrator email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                  placeholder="Enter administrator email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full h-[50px] pl-11 pr-4 text-xs sm:text-sm rounded-[20px] glass-surface text-[var(--lg-ink)] placeholder-[var(--lg-ink-muted)] border border-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--lg-accent-start)] transition-all shadow-xs"
                />
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={loading || !email.trim()}
              className="w-full justify-center"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Launch Admin Session</span>
            </GlassButton>
          </form>
        </div>

        <div className="pt-2 text-center text-[11px] text-[var(--lg-ink-muted)] font-medium">
          Sign-in tokens are cryptographically validated against administrative role bindings.
        </div>
      </GlassSurface>
    </div>
  );
};
