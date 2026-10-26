import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePackageName,
  validateVersionCode,
  isZipArchive,
  calculateSha256,
  validateApkAgainstApp,
  inspectApkBinary,
} from './apkValidator';

test('validatePackageName accepts valid Android package names', () => {
  assert.equal(validatePackageName('com.example.app').valid, true);
  assert.equal(validatePackageName('org.mozilla.firefox').valid, true);
  assert.equal(validatePackageName('com.google.android.apps.photos').valid, true);
  assert.equal(validatePackageName('io.github.app_drop').valid, true);
});

test('validatePackageName rejects invalid package names', () => {
  assert.equal(validatePackageName('').valid, false);
  assert.equal(validatePackageName('app').valid, false); // needs at least two segments
  assert.equal(validatePackageName('123.com.app').valid, false); // cannot start segment with digit
  assert.equal(validatePackageName('com.example.app!').valid, false); // invalid characters
});

test('validateVersionCode handles integer bounds and duplicates', () => {
  assert.equal(validateVersionCode(1, []).valid, true);
  assert.equal(validateVersionCode(105, [1, 2, 100]).valid, true);
  assert.equal(validateVersionCode(0, []).valid, false); // must be > 0
  assert.equal(validateVersionCode(-5, []).valid, false);
  assert.equal(validateVersionCode(1.5, []).valid, false); // must be integer
  assert.equal(validateVersionCode(10, [5, 10, 15]).valid, false); // duplicate
  assert.equal(validateVersionCode(10, [5, 10, 15], true).valid, true); // rollback allowed
});

test('isZipArchive detects ZIP magic header', () => {
  const zipBuffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]).buffer;
  assert.equal(isZipArchive(zipBuffer), true);

  const nonZipBuffer = new Uint8Array([0x7f, 0x45, 0x4c, 0x46]).buffer;
  assert.equal(isZipArchive(nonZipBuffer), false);
});

test('calculateSha256 produces 64 character hex string', async () => {
  const buffer = new TextEncoder().encode('Hello Android APK Distribution').buffer;
  const hash = await calculateSha256(buffer);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 64);
});

test('validateApkAgainstApp rejects mismatches and accepts compliant metadata', async () => {
  const fakeZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02, 0x03, 0x04]).buffer;
  const metadata = await inspectApkBinary(fakeZip, 'com.example.testapp-v2.0.0-c20.apk', 'com.example.testapp');

  const result = validateApkAgainstApp(metadata, 'com.example.testapp', [1, 10]);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);

  // Mismatched package name
  const mismatchResult = validateApkAgainstApp(metadata, 'com.other.company.app', [1, 10]);
  assert.equal(mismatchResult.valid, false);
  assert.match(mismatchResult.errors[0], /Package name mismatch/);
});
