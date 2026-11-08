import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatApkDownloadFileName, estimateDownloadDuration } from './downloadHelper';

test('formatApkDownloadFileName uses display name instead of package name', () => {
  const result = formatApkDownloadFileName('Signal', '5.40.1');
  assert.equal(result, 'Signal-v5.40.1.apk');
});

test('formatApkDownloadFileName handles multi-word display names cleanly', () => {
  const result = formatApkDownloadFileName('Nova Launcher Prime', '7.0.57');
  assert.equal(result, 'Nova Launcher Prime-v7.0.57.apk');
});

test('formatApkDownloadFileName strips leading v from version to prevent double-v', () => {
  const result1 = formatApkDownloadFileName('Aurora Store', 'v4.3.2');
  assert.equal(result1, 'Aurora Store-v4.3.2.apk');

  const result2 = formatApkDownloadFileName('Aurora Store', 'V1.0.0');
  assert.equal(result2, 'Aurora Store-v1.0.0.apk');
});

test('formatApkDownloadFileName sanitizes illegal filesystem characters', () => {
  const result = formatApkDownloadFileName('App / Tool : Pro * Edition?', '2.1.0');
  assert.equal(result, 'App Tool Pro Edition-v2.1.0.apk');
});

test('formatApkDownloadFileName falls back gracefully if app name is missing or empty', () => {
  assert.equal(formatApkDownloadFileName('', '1.0.0'), 'Application-v1.0.0.apk');
  assert.equal(formatApkDownloadFileName(null, '1.0.0'), 'Application-v1.0.0.apk');
  assert.equal(formatApkDownloadFileName(undefined, '1.0.0'), 'Application-v1.0.0.apk');
});

test('formatApkDownloadFileName handles missing version name', () => {
  assert.equal(formatApkDownloadFileName('Telegram'), 'Telegram.apk');
  assert.equal(formatApkDownloadFileName('Telegram', ''), 'Telegram.apk');
  assert.equal(formatApkDownloadFileName('Telegram', null), 'Telegram.apk');
});

test('estimateDownloadDuration returns quick response for zero or invalid sizes', () => {
  const result = estimateDownloadDuration(0);
  assert.equal(result.wifi5g, '< 1s');
  assert.equal(result.lte4g, '< 1s');
  assert.ok(result.summary.includes('< 1s'));
});

test('estimateDownloadDuration computes accurate times for typical APK sizes', () => {
  // ~15 MB APK
  const result15Mb = estimateDownloadDuration(15 * 1024 * 1024);
  assert.equal(result15Mb.wifi5g, '~2s');
  assert.equal(result15Mb.lte4g, '~7s');
  assert.ok(result15Mb.summary.includes('~2s on 5G/Wi-Fi'));

  // ~7.31 MB APK
  const result7Mb = estimateDownloadDuration(7.31 * 1024 * 1024);
  assert.equal(result7Mb.wifi5g, '~1s');
  assert.equal(result7Mb.lte4g, '~3s');
});
