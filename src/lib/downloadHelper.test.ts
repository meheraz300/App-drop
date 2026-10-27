import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatApkDownloadFileName } from './downloadHelper';

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
