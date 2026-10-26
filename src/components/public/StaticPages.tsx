import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ArrowLeft, Mail, Lock } from 'lucide-react';
import { GlassSurface } from '../common/GlassComponents';

interface StaticPageProps {
  type: 'about' | 'privacy' | 'terms' | 'contact';
}

export const StaticPages: React.FC<StaticPageProps> = ({ type }) => {
  const { navigateTo } = useApp();

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-10 space-y-8">
      <button
        onClick={() => navigateTo('home')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] transition-colors glass-pressable"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Applications</span>
      </button>

      {type === 'about' && (
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--lg-ink)]">
              About AppDrop Distribution Hub
            </h1>
            <p className="text-sm text-[var(--lg-ink-muted)]">
              Trusted, independent distribution platform for verified Android application releases.
            </p>
          </div>

          <GlassSurface variant="card" className="p-8 sm:p-10 space-y-6 text-sm text-[var(--lg-ink-muted)] leading-relaxed">
            <p>
              AppDrop was engineered to solve a fundamental need in the modern Android ecosystem: a clean, responsive, and cryptographically verified hub to publish and obtain Android APK packages without forced third-party stores, tracking telemetry, or arbitrary algorithmic restrictions.
            </p>
            <h3 className="font-extrabold text-[var(--lg-ink)] text-lg pt-2">
              Our Security Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-[20px] bg-white/20 dark:bg-white/5 border border-white/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--lg-ink)] text-sm">
                  <ShieldCheck className="h-4 w-4 text-[var(--lg-accent-start)]" />
                  <span>Backend Package Validation</span>
                </div>
                <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                  Every uploaded APK is structurally extracted and inspected. The backend validates package name consistency, version code rules, and APK Signature Scheme v2/v3 certificates.
                </p>
              </div>

              <div className="p-5 rounded-[20px] bg-white/20 dark:bg-white/5 border border-white/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--lg-ink)] text-sm">
                  <Lock className="h-4 w-4 text-[var(--lg-success)]" />
                  <span>Immutable Version History</span>
                </div>
                <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                  Published binaries are immutable and backed by historical records. In the event of an unforeseen regression, administrators can trigger atomic rollbacks in seconds.
                </p>
              </div>
            </div>
          </GlassSurface>
        </article>
      )}

      {type === 'privacy' && (
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--lg-ink)]">
              Privacy Policy
            </h1>
            <p className="text-sm text-[var(--lg-ink-muted)]">
              Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <GlassSurface variant="card" className="p-8 sm:p-10 space-y-5 text-sm text-[var(--lg-ink-muted)] leading-relaxed">
            <h3 className="font-bold text-[var(--lg-ink)] text-base">
              1. Information We Do Not Collect
            </h3>
            <p>
              Public visitors to AppDrop are not required to create user accounts, link phone numbers, or provide email addresses. We do not track cross-site cookies, collect advertising IDs, or build behavioral user dossiers.
            </p>

            <h3 className="font-bold text-[var(--lg-ink)] text-base pt-2">
              2. Download Request Semantics & Aggregation
            </h3>
            <p>
              When an APK download URL is generated, the server records an anonymous download request event with a non-personalized request identifier to compute daily download tallies. This metric measures server-observed download link requests and does not store device identifiers or personal IP fingerprints.
            </p>

            <h3 className="font-bold text-[var(--lg-ink)] text-base pt-2">
              3. Administrative Authentication
            </h3>
            <p>
              Only authorized site administrators authenticate via Firebase Google Sign-in to access publication and management tools. Administrative actions are logged to append-only audit records to preserve platform security.
            </p>
          </GlassSurface>
        </article>
      )}

      {type === 'terms' && (
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--lg-ink)]">
              Terms of Use & Distribution
            </h1>
            <p className="text-sm text-[var(--lg-ink-muted)]">
              Conditions governing access and software distribution on AppDrop.
            </p>
          </div>

          <GlassSurface variant="card" className="p-8 sm:p-10 space-y-5 text-sm text-[var(--lg-ink-muted)] leading-relaxed">
            <h3 className="font-bold text-[var(--lg-ink)] text-base">
              1. Software Distribution & Sideloading
            </h3>
            <p>
              All software distributed on this hub consists of Android application packages (.apk). By downloading software packages, you acknowledge that Android requires manual user authorization to install software from sources outside Google Play.
            </p>

            <h3 className="font-bold text-[var(--lg-ink)] text-base pt-2">
              2. Integrity & Cryptographic Signatures
            </h3>
            <p>
              AppDrop verifies that published packages match developer signing certificates and match their published SHA-256 digests. Users are strongly encouraged to cross-reference the displayed SHA-256 checksums before installation.
            </p>

            <h3 className="font-bold text-[var(--lg-ink)] text-base pt-2">
              3. Disclaimer of Warranties
            </h3>
            <p>
              Applications are provided "as is" without warranty of any kind. AppDrop and its administrators do not warrant that distributed applications will be error-free or compatible with all Android hardware revisions.
            </p>
          </GlassSurface>
        </article>
      )}

      {type === 'contact' && (
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--lg-ink)]">
              Security & Contact Information
            </h1>
            <p className="text-sm text-[var(--lg-ink-muted)]">
              Get in touch with the platform administrator or report security observations.
            </p>
          </div>

          <GlassSurface variant="card" className="p-8 sm:p-10 space-y-6 text-sm text-[var(--lg-ink-muted)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 dark:bg-white/10 text-[var(--lg-accent-start)] border border-white/30 shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--lg-ink)] text-base">
                  Administrator Inquiries
                </h4>
                <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                  Direct administrative inquiries and release coordination.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/20 dark:border-white/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 dark:bg-white/10 text-[var(--lg-success)] border border-white/30 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--lg-ink)] text-base">
                  Security Vulnerability Disclosure
                </h4>
                <p className="text-xs text-[var(--lg-ink-muted)] leading-relaxed">
                  If you discover a checksum discrepancy, signing anomaly, or vulnerability in any distributed package, please include the package name, version code, and observed SHA-256 digest in your report.
                </p>
              </div>
            </div>
          </GlassSurface>
        </article>
      )}
    </div>
  );
};
