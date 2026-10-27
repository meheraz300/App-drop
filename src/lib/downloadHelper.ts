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
