/**
 * Mobile APK Installation & Troubleshooting Helper
 * Provides diagnostic tools, device-specific instructions, and error solutions
 * for users installing Android applications downloaded from the web.
 */

export type DeviceBrand = 'samsung' | 'pixel' | 'xiaomi' | 'oneplus_oppo' | 'generic';

export type InstallIssueType =
  | 'unknown_sources'
  | 'play_protect'
  | 'cant_open_file'
  | 'parse_error'
  | 'app_conflict'
  | 'storage_full'
  | 'download_corrupt';

export interface DeviceInstruction {
  brand: DeviceBrand;
  brandName: string;
  steps: string[];
  settingsPath: string;
  notes?: string;
}

export interface TroubleshootingGuide {
  id: InstallIssueType;
  title: string;
  symptom: string;
  explanation: string;
  solutionSteps: string[];
  proTip?: string;
}

/**
 * Detects whether the current browser user agent is an Android device.
 */
export function isAndroidDevice(userAgent?: string): boolean {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /Android/i.test(ua);
}

/**
 * Detects whether the current device is a mobile device (Android, iOS, tablet, etc.).
 */
export function isMobileDevice(userAgent?: string): boolean {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Detects device brand based on user agent heuristics if available.
 */
export function detectDeviceBrand(userAgent?: string): DeviceBrand {
  const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (ua.includes('samsung') || ua.includes('sm-')) return 'samsung';
  if (ua.includes('pixel')) return 'pixel';
  if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('miui') || ua.includes('poco')) return 'xiaomi';
  if (ua.includes('oneplus') || ua.includes('oppo') || ua.includes('realme')) return 'oneplus_oppo';
  return 'generic';
}

/**
 * Device-specific instructions for enabling "Install Unknown Apps"
 */
export const DEVICE_INSTRUCTIONS: Record<DeviceBrand, DeviceInstruction> = {
  samsung: {
    brand: 'samsung',
    brandName: 'Samsung Galaxy (One UI)',
    settingsPath: 'Settings > Apps > Menu (3 dots) or Special access > Install unknown apps',
    steps: [
      'When downloading finishes, tap "Open" or pull down notifications and tap the APK file.',
      'If you see "For your security, your phone is not allowed to install unknown apps", tap "Settings".',
      'Toggle ON the switch next to "Allow from this source" for your browser (Chrome or Samsung Internet).',
      'Press the Back button once and tap "Install".',
      'If prompted by Samsung Knox / App Protection, tap "Install Anyway".',
    ],
    notes: 'On newer Samsung One UI (6.0+), you can also check: Settings > Security and privacy > Auto Blocker. If Auto Blocker is ON, temporarily toggle it OFF to allow web APK installations.',
  },
  pixel: {
    brand: 'pixel',
    brandName: 'Google Pixel / Motorola / Stock Android',
    settingsPath: 'Settings > Apps > Special app access > Install unknown apps',
    steps: [
      'Tap the downloaded APK notification or find it in the "Files by Google" app under Downloads.',
      'When prompted with "For your security, your phone is not allowed to install unknown apps from this source", tap "Settings".',
      'Switch the toggle ON for "Allow from this source".',
      'Tap the Back arrow at the top-left, then tap "Install" on the confirmation dialog.',
      'If Google Play Protect warns "Unsafe app blocked", tap "More details" and select "Install anyway".',
    ],
    notes: 'Google Pixel devices rely on Files by Google as the default system package installer helper.',
  },
  xiaomi: {
    brand: 'xiaomi',
    brandName: 'Xiaomi / Redmi / POCO (HyperOS / MIUI)',
    settingsPath: 'Settings > Privacy protection > Special permissions > Install unknown apps',
    steps: [
      'Open the downloaded APK from notification tray or the MIUI File Manager.',
      'When the security warning appears, tap "Settings".',
      'Enable "Allow from this source".',
      'MIUI will show a 10-second security countdown: check "I am aware of the possible risks" and tap "OK".',
      'Tap "Install" to complete the setup.',
    ],
    notes: 'Xiaomi MIUI/HyperOS Security app might scan the APK after installation. Tap "Open" after scan completes.',
  },
  oneplus_oppo: {
    brand: 'oneplus_oppo',
    brandName: 'OnePlus / OPPO / Realme (OxygenOS / ColorOS)',
    settingsPath: 'Settings > Apps > Special app access > Install unknown apps',
    steps: [
      'Tap the download notification or open the APK from the "My Files" app.',
      'Tap "Settings" when prompted that the phone is not allowed to install unknown apps.',
      'Turn ON "Allow apps from this source".',
      'Press Back and tap "Install".',
    ],
  },
  generic: {
    brand: 'generic',
    brandName: 'All Other Android Devices',
    settingsPath: 'Settings > Apps & Notifications > Special access > Install unknown apps',
    steps: [
      'Pull down the notification drawer and tap the downloaded APK file.',
      'If a security prompt appears, tap "Settings".',
      'Toggle ON "Allow from this source" for your web browser or file manager.',
      'Tap Back and press "Install".',
      'If Play Protect shows a warning dialog, tap "More details" followed by "Install anyway".',
    ],
  },
};

/**
 * Diagnostic troubleshooting guides for all common mobile installation barriers
 */
export const TROUBLESHOOTING_GUIDES: TroubleshootingGuide[] = [
  {
    id: 'unknown_sources',
    title: '"Phone not allowed to install unknown apps" / Security Block',
    symptom: 'Android displays a message saying "For your security, your phone is not allowed to install unknown apps from this source."',
    explanation: 'Android protects against accidental sideloading by requiring explicit permission for each app (like Chrome, Samsung Internet, or Files) to install external APKs.',
    solutionSteps: [
      'When the popup appears on screen, tap "Settings".',
      'Turn ON the toggle switch for "Allow from this source".',
      'Press the Back button on your phone.',
      'Tap "Install" on the package prompt that appears.',
    ],
    proTip: 'If you accidentally tapped "Cancel", simply open your phone\'s built-in "Files" or "My Files" app, go to Downloads, tap the file again, and select "Settings".',
  },
  {
    id: 'play_protect',
    title: '"Blocked by Play Protect" / "Harmful app blocked"',
    symptom: 'A red or orange dialog appears with "Blocked by Play Protect" and only shows an "OK" button.',
    explanation: 'Google Play Protect alerts users for any app downloaded outside the Google Play Store because it has not been reviewed by Google\'s automated store pipeline.',
    solutionSteps: [
      'Look closely at the Play Protect popup.',
      'Tap the small text that says "More details" (or the dropdown arrow).',
      'A hidden option will appear: tap "Install anyway".',
      'The installation will proceed normally.',
    ],
    proTip: 'AppDrop verifies cryptographic signatures (SHA-256) of all published packages so you know the file is authentic and unaltered.',
  },
  {
    id: 'cant_open_file',
    title: '"Can\'t open file" / Nothing happens when tapping notification',
    symptom: 'You tap the download notification in Chrome or browser, and your phone says "Can\'t open file" or "No app found to open file".',
    explanation: 'Web browsers sometimes do not pass the APK file to the Android Package Installer properly through the notification shade.',
    solutionSteps: [
      'Open your phone\'s built-in File Manager app (e.g. "Files", "My Files", or "File Commander").',
      'Open the "Downloads" folder.',
      'Locate the file ending in ".apk" (e.g. "Application-v1.0.0.apk").',
      'Tap the APK file directly from the file manager.',
      'If prompted, allow the File Manager app to install unknown apps, then tap "Install".',
    ],
    proTip: 'If your phone lacks a file manager, download the official "Files by Google" app from the Play Store.',
  },
  {
    id: 'parse_error',
    title: '"There was a problem parsing the package" (Parse Error)',
    symptom: 'When you tap install, a message instantly says "There was a problem parsing the package".',
    explanation: 'This occurs if the APK download was interrupted (corrupted binary), the file was saved with an incorrect extension (like .bin or .zip), or the app requires a newer version of Android than your device has.',
    solutionSteps: [
      'Step 1: Check your file extension. Ensure the filename ends with ".apk" and NOT ".apk.zip" or ".bin". Rename it if necessary.',
      'Step 2: Re-download the APK. An unstable mobile network can cut off the download prematurely.',
      'Step 3: Check your Android OS version in Settings > About Phone. Ensure your phone meets the minimum supported Android OS version.',
    ],
    proTip: 'Always verify the downloaded file size matches the size shown on the app details page.',
  },
  {
    id: 'app_conflict',
    title: '"App not installed" / Package Signature Conflict',
    symptom: 'Android begins installing, but finishes with a generic "App not installed" error.',
    explanation: 'Android strictly forbids installing an update if an existing version of the app is already on your phone signed with a different developer key, or if you are trying to install an older version over a newer one.',
    solutionSteps: [
      'Check if an earlier version of this app is already installed on your phone.',
      'Uninstall the existing version from your home screen or Settings > Apps.',
      '(Optional: backup any local app data before uninstalling).',
      'Return to your Downloads folder and tap the downloaded APK to install fresh.',
    ],
    proTip: 'Once uninstalled, the new build will install cleanly without signature conflict.',
  },
  {
    id: 'storage_full',
    title: '"Not enough storage" / Installation aborts silently',
    symptom: 'The install button is greyed out or installation fails without an error code.',
    explanation: 'Android requires free storage space not just for the APK file, but also space to extract the DEX bytecode and native libraries during installation (typically 2-3x the APK size).',
    solutionSteps: [
      'Open Settings > Storage on your device.',
      'Ensure you have at least 500 MB to 1 GB of free internal storage.',
      'Delete unused cache, old videos, or duplicate downloads.',
      'Try the installation again.',
    ],
  },
  {
    id: 'download_corrupt',
    title: 'Download interrupted or incomplete',
    symptom: 'Download stops at 99%, fails to start, or browser reloads.',
    explanation: 'Network interruptions or battery saver modes can kill background downloads in mobile browsers.',
    solutionSteps: [
      'Ensure you have a stable Wi-Fi or cellular data connection.',
      'Do not close or minimize the browser tab until the progress bar reaches 100%.',
      'Tap the "Direct Re-download" button to trigger a fresh download stream.',
    ],
  },
];

/**
 * Diagnoses an error symptom or message and returns the most relevant troubleshooting guide.
 */
export function diagnoseInstallIssue(queryOrError: string): TroubleshootingGuide {
  const text = (queryOrError || '').toLowerCase();

  if (text.includes('unknown') || text.includes('security') || text.includes('not allowed') || text.includes('source')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'unknown_sources')!;
  }
  if (text.includes('protect') || text.includes('harmful') || text.includes('blocked by play') || text.includes('unsafe')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'play_protect')!;
  }
  if (text.includes('parse') || text.includes('parsing') || text.includes('problem parsing') || text.includes('corrupt')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'parse_error')!;
  }
  if (text.includes('conflict') || text.includes('not installed') || text.includes('existing package') || text.includes('signature')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'app_conflict')!;
  }
  if (text.includes("can't open") || text.includes('cannot open') || text.includes('no app found') || text.includes('open file')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'cant_open_file')!;
  }
  if (text.includes('storage') || text.includes('space') || text.includes('full') || text.includes('memory')) {
    return TROUBLESHOOTING_GUIDES.find((g) => g.id === 'storage_full')!;
  }

  // Default to unknown sources as it represents over 85% of sideloading issues
  return TROUBLESHOOTING_GUIDES[0];
}

/**
 * Prepares direct download parameters with correct MIME type and Content-Disposition helpers.
 */
export function sanitizeApkFileName(rawName?: string, rawVersion?: string): string {
  const base = (rawName || 'Application')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Application';
  
  const ver = rawVersion ? `-v${rawVersion.replace(/^v/i, '').trim()}` : '';
  const finalName = `${base}${ver}`;
  return finalName.endsWith('.apk') ? finalName : `${finalName}.apk`;
}
