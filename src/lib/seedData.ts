import type { AppRecord, VersionRecord, DownloadStat, AuditLog, SystemConfig } from '../types';

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'Scheduled server maintenance in progress. APK downloads will resume shortly.',
  maxUploadSizeBytes: 500 * 1024 * 1024, // 500 MB
  updatedAt: new Date().toISOString(),
};

export const INITIAL_APPS: AppRecord[] = [
  {
    id: 'app_quantum_guard',
    name: 'QuantumGuard OTP Authenticator',
    packageName: 'org.appdrop.quantumguard',
    shortDescription: 'Cryptographically hardened offline multi-factor authenticator with biometrics.',
    description: 'QuantumGuard provides enterprise-grade two-factor authentication for Android. Fully offline token generation, zero network telemetry, biometric vault locking, and encrypted backup recovery.',
    category: 'Tools',
    tags: ['security', '2fa', 'privacy', 'biometrics'],
    iconPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23qg)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_quantum_latest',
    featured: true,
    featuredOrder: 1,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    archivedAt: null,
  },
  {
    id: 'app_liquid_flow',
    name: 'LiquidFlow Tasks & Notes',
    packageName: 'io.appdrop.liquidflow',
    shortDescription: 'Minimalist glassmorphic productivity and markdown workspace.',
    description: 'A distraction-free markdown note-taking suite designed with liquid fluid animations, task scheduling, offline synchronization, and instant export options.',
    category: 'Productivity',
    tags: ['notes', 'markdown', 'productivity', 'tasks'],
    iconPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%236d28d9"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23lf)"/><path d="M50 22 L75 32 C75 58 50 78 50 78 C50 78 25 58 25 32 Z" fill="white"/><path d="M44 48 L48 52 L58 40" stroke="%236d28d9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_liquid_latest',
    featured: true,
    featuredOrder: 2,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    archivedAt: null,
  },
];

export const INITIAL_VERSIONS: VersionRecord[] = [
  {
    id: 'ver_quantum_latest',
    appId: 'app_quantum_guard',
    versionName: '3.2.0',
    versionCode: 320,
    releaseNotes: 'Added support for hardware FIDO2 keys and automated backup encryption.',
    apkPath: '/sample-apks/quantumguard-3.2.0.apk',
    apkSizeBytes: 24 * 1024 * 1024 + 400 * 1024,
    sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    signingCertificateSha256: 'f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef',
    status: 'published',
    isLatest: true,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdBy: 'admin@appdrop.io',
  },
  {
    id: 'ver_liquid_latest',
    appId: 'app_liquid_flow',
    versionName: '1.4.2',
    versionCode: 142,
    releaseNotes: 'Liquid glass UI update, enhanced dark mode contrast, and faster sync speeds.',
    apkPath: '/sample-apks/liquidflow-1.4.2.apk',
    apkSizeBytes: 18 * 1024 * 1024 + 120 * 1024,
    sha256: '9876543210fedcba0987654321fedcba0123456789abcdef0123456789abcdef',
    signingCertificateSha256: '123456789abcdef0123456789abcdef0987654321fedcba0987654321fedcba0',
    status: 'published',
    isLatest: true,
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdBy: 'admin@appdrop.io',
  },
];

export const INITIAL_DOWNLOAD_STATS: DownloadStat[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
