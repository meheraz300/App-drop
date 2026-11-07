import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAndroidDevice,
  isMobileDevice,
  detectDeviceBrand,
  diagnoseInstallIssue,
  DEVICE_INSTRUCTIONS,
  TROUBLESHOOTING_GUIDES,
  sanitizeApkFileName,
} from './mobileInstallHelper';

test('isAndroidDevice correctly detects Android user agents', () => {
  const androidUa = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
  const desktopUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

  assert.equal(isAndroidDevice(androidUa), true);
  assert.equal(isAndroidDevice(desktopUa), false);
  assert.equal(isAndroidDevice(iphoneUa), false);
});

test('isMobileDevice correctly identifies mobile platforms', () => {
  assert.equal(isMobileDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7)'), true);
  assert.equal(isMobileDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)'), true);
  assert.equal(isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), false);
});

test('detectDeviceBrand classifies manufacturer from UA string', () => {
  assert.equal(detectDeviceBrand('Mozilla/5.0 (Linux; Android 14; SM-G998B)'), 'samsung');
  assert.equal(detectDeviceBrand('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro)'), 'pixel');
  assert.equal(detectDeviceBrand('Mozilla/5.0 (Linux; Android 13; Redmi Note 12)'), 'xiaomi');
  assert.equal(detectDeviceBrand('Mozilla/5.0 (Linux; Android 13; CPH2415 OnePlus)'), 'oneplus_oppo');
  assert.equal(detectDeviceBrand('Mozilla/5.0 (Linux; Android 12; Moto G)'), 'generic');
});

test('diagnoseInstallIssue routes symptom keywords to correct guides', () => {
  // Unknown sources
  const unknownDiag = diagnoseInstallIssue('phone is not allowed to install unknown apps from this source');
  assert.equal(unknownDiag.id, 'unknown_sources');
  assert.ok(unknownDiag.solutionSteps.length >= 3);

  // Play protect
  const protectDiag = diagnoseInstallIssue('Blocked by Play Protect: Unsafe app blocked');
  assert.equal(protectDiag.id, 'play_protect');
  assert.ok(protectDiag.solutionSteps.some((s) => s.includes('Install anyway')));

  // Parse error
  const parseDiag = diagnoseInstallIssue('There was a problem parsing the package');
  assert.equal(parseDiag.id, 'parse_error');

  // App conflict
  const conflictDiag = diagnoseInstallIssue('App not installed: An existing package conflicts');
  assert.equal(conflictDiag.id, 'app_conflict');
  assert.ok(conflictDiag.solutionSteps.some((s) => s.includes('Uninstall')));

  // Can't open file
  const openDiag = diagnoseInstallIssue("Can't open file when tapping notification");
  assert.equal(openDiag.id, 'cant_open_file');
  assert.ok(openDiag.solutionSteps.some((s) => s.includes('File Manager') || s.includes('Files')));
});

test('DEVICE_INSTRUCTIONS provides actionable steps for all supported brands', () => {
  const brands = ['samsung', 'pixel', 'xiaomi', 'oneplus_oppo', 'generic'] as const;
  for (const b of brands) {
    const inst = DEVICE_INSTRUCTIONS[b];
    assert.ok(inst, `Missing instructions for brand ${b}`);
    assert.ok(inst.brandName.length > 0);
    assert.ok(inst.steps.length >= 4);
    assert.ok(inst.settingsPath.length > 0);
  }
});

test('sanitizeApkFileName guarantees clean .apk suffix and strips illegal chars', () => {
  assert.equal(sanitizeApkFileName('My Awesome App', '1.0.0'), 'My Awesome App-v1.0.0.apk');
  assert.equal(sanitizeApkFileName('Test/App?*:', 'v2.3'), 'TestApp-v2.3.apk');
  assert.equal(sanitizeApkFileName('AlreadyApp.apk', ''), 'AlreadyApp.apk');
  assert.equal(sanitizeApkFileName('', ''), 'Application.apk');
});

test('TROUBLESHOOTING_GUIDES contains comprehensive resolutions for top 6 issues', () => {
  assert.ok(TROUBLESHOOTING_GUIDES.length >= 6);
  const ids = TROUBLESHOOTING_GUIDES.map((g) => g.id);
  assert.ok(ids.includes('unknown_sources'));
  assert.ok(ids.includes('play_protect'));
  assert.ok(ids.includes('cant_open_file'));
  assert.ok(ids.includes('parse_error'));
  assert.ok(ids.includes('app_conflict'));
  assert.ok(ids.includes('storage_full'));
});
