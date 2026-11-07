import type { AppRecord, VersionRecord, DownloadStat, AuditLog, SystemConfig } from '../types';

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'Scheduled server maintenance in progress. APK downloads will resume shortly.',
  maxUploadSizeBytes: 500 * 1024 * 1024, // 500 MB
  updatedAt: new Date().toISOString(),
};

export const INITIAL_APPS: AppRecord[] = [
  {
    id: 'app_calculator_official',
    name: 'Simple Calculator',
    packageName: 'com.simplemobiletools.calculator',
    shortDescription: 'Clean, ad-free Android calculator with standard and scientific modes, unit conversion, and history.',
    description: 'Official Simple Calculator release. Lightweight, ad-free Android calculator featuring standard arithmetic, scientific functions, history log, dark mode, and offline calculation. Directly published with verified digital signatures and cryptographic checksums.',
    category: 'Utilities',
    tags: ['calculator', 'utilities', 'tools', 'android'],
    iconPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="calc" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23ea580c"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23calc)"/><rect x="22" y="18" width="56" height="18" rx="5" fill="%23ffffff" fill-opacity="0.9"/><text x="72" y="32" font-family="monospace" font-size="13" font-weight="bold" fill="%231e293b" text-anchor="end">123,456</text><circle cx="32" cy="48" r="6" fill="white"/><circle cx="50" cy="48" r="6" fill="white"/><circle cx="68" cy="48" r="6" fill="white"/><circle cx="32" cy="64" r="6" fill="white"/><circle cx="50" cy="64" r="6" fill="white"/><circle cx="68" cy="64" r="6" fill="white"/><circle cx="32" cy="80" r="6" fill="white"/><circle cx="50" cy="80" r="6" fill="white"/><circle cx="68" cy="80" r="6" fill="white" fill-opacity="0.8"/></svg>',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_calculator_5_12_0',
    featured: true,
    featuredOrder: 1,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-07T07:30:00.000Z',
    archivedAt: null,
  },
  {
    id: 'app_1793716730739_iuf0',
    name: 'Anifam App',
    packageName: 'com.example.app',
    shortDescription: 'Anifam App Android application package.',
    description: 'Anifam App application package. Directly published with verified digital signatures and cryptographic checksums.',
    category: 'Tools',
    tags: ['tools', 'android', 'apk'],
    iconPath: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_app_1793716730739_iuf0_1793716730739',
    featured: false,
    featuredOrder: 2,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: '2026-11-03T14:44:21.000Z',
    updatedAt: '2026-11-07T07:30:00.000Z',
    archivedAt: null,
  },
];

export const INITIAL_VERSIONS: VersionRecord[] = [
  {
    id: 'ver_calculator_5_12_0',
    appId: 'app_calculator_official',
    versionName: '5.12.0',
    versionCode: 61,
    releaseNotes: 'Official Simple Calculator v5.12.0 release\n• High-precision calculations and dark theme support\n• Complete history calculation view and unit converter\n• Verified signature and clean parse guarantee on Android 6.0 through Android 15+',
    apkPath: 'published/app_calculator_official/ver_calculator_5_12_0/Simple_Calculator-v5.12.0.apk',
    apkSizeBytes: 9684763,
    sha256: '092629deaeaaea824dbf0cd824989e80b498b1fa07ad5b4c3e744fc64ce5ab2f',
    signingCertificateSha256: 'SHA256:47:8C:8B:22:98:C0:B0:1B:5C:28:B1:00:8C:11:90:54',
    status: 'published',
    isLatest: true,
    publishedAt: '2026-11-03T10:00:00.000Z',
    createdAt: '2026-11-03T10:00:00.000Z',
    createdBy: 'mh3620305@gmail.com',
    downloadUrl: '/App-drop/api/apks/ver_calculator_5_12_0/download',
  },
  {
    id: 'ver_app_1793716730739_iuf0_1793716730739',
    appId: 'app_1793716730739_iuf0',
    versionName: '0.0.1',
    versionCode: 10001,
    releaseNotes: 'Release 0.0.1 • Performance improvements and bug fixes.',
    apkPath: 'published/app_1793716730739_iuf0/ver_app_1793716730739_iuf0_1793716730739/Anifam_App-v0.0.1.apk',
    apkSizeBytes: 9684763,
    sha256: '092629deaeaaea824dbf0cd824989e80b498b1fa07ad5b4c3e744fc64ce5ab2f',
    signingCertificateSha256: 'SHA256:FA:32:89:E1:90:54:11:00:23:44:BC:11:22:33:44:55',
    status: 'published',
    isLatest: true,
    publishedAt: '2026-11-03T14:44:21.000Z',
    createdAt: '2026-11-03T14:44:21.000Z',
    createdBy: 'mh3620305@gmail.com',
    downloadUrl: '/App-drop/api/apks/ver_app_1793716730739_iuf0_1793716730739/download',
  },
];

export const INITIAL_DOWNLOAD_STATS: DownloadStat[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
