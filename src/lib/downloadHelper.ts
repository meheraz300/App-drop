/**
 * Utility for formatting APK download filenames dynamically from application display names.
 */

/**
 * Dynamically formats an APK download filename based on the application's display name
 * and release version, replacing generic package-name formats.
 *
 * Sanitizes characters that are illegal or problematic in common file systems
 * (/ \ : * ? " < > | and control characters), trims extra whitespace, and
 * attaches a clean version tag and .apk extension.
 *
 * @param appName The application display name (e.g., "Aurora Store", "Signal Messenger")
 * @param versionName The release version name (e.g., "4.3.2", "v2.1.0")
 * @returns Clean APK filename (e.g., "Aurora Store-v4.3.2.apk")
 */
export function formatApkDownloadFileName(appName?: string | null, versionName?: string | null): string {
  const rawName = (appName || '').trim();

  // Remove illegal file system characters: / \ ? % * : | " < > and ASCII control chars
  const sanitized = rawName
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const baseName = sanitized || 'Application';

  if (versionName && versionName.trim()) {
    // Strip redundant leading 'v' or 'V' to avoid double-v like "-vv1.0.0"
    const cleanVersion = versionName.trim().replace(/^v/i, '');
    return `${baseName}-v${cleanVersion}.apk`;
  }

  return `${baseName}.apk`;
}

/**
 * Estimates the download duration for an APK file across Wi-Fi/5G and 4G LTE connections.
 * Provides clear human-readable time estimates so users know exactly how long the download will take.
 */
export function estimateDownloadDuration(sizeBytes: number): {
  wifi5g: string;
  lte4g: string;
  summary: string;
} {
  if (!sizeBytes || sizeBytes <= 0) {
    return { wifi5g: '< 1s', lte4g: '< 1s', summary: '< 1s on Wi-Fi / 5G' };
  }

  // 5G / High-Speed Wi-Fi (~60 Mbps = 7.5 MB/s)
  const wifiSec = Math.max(1, Math.round(sizeBytes / (7.5 * 1024 * 1024)));
  // 4G LTE (~18 Mbps = 2.25 MB/s)
  const lteSec = Math.max(1, Math.round(sizeBytes / (2.25 * 1024 * 1024)));

  const wifiFormatted = wifiSec <= 1 ? '~1s' : `~${wifiSec}s`;
  const lteFormatted = lteSec <= 1 ? '~1s' : `~${lteSec}s`;

  return {
    wifi5g: wifiFormatted,
    lte4g: lteFormatted,
    summary: `${wifiFormatted} on 5G/Wi-Fi · ${lteFormatted} on 4G`,
  };
}
