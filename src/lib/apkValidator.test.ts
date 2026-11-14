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

test('inspectApkBinary decodes real AndroidManifest.xml from signed template.apk', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const templatePath = path.join(process.cwd(), 'public', 'assets', 'template.apk');
  if (fs.existsSync(templatePath)) {
    const fileBuf = fs.readFileSync(templatePath);
    const meta = await inspectApkBinary(fileBuf.buffer, 'Calculator.apk');
    assert.equal(meta.packageName, 'com.simplemobiletools.calculator');
    assert.equal(meta.versionName, '5.12.0');
    assert.equal(meta.versionCode, 61);
    assert.equal(meta.fileSizeBytes, 9684763);
    assert.ok(meta.signingCertificateSha256.startsWith('SHA256:'));
  }
});

test('extractManifestMetadataFromApk & inspectApkFile decode manifest with bit-3 Data Descriptor (compSize=0 in Local Header)', async () => {
  const { buildBinaryAndroidManifest, computeCrc32 } = await import('./binaryStorage');
  const { inspectApkFile, extractManifestMetadataFromApk } = await import('./apkValidator');

  const axml = buildBinaryAndroidManifest('com.descriptor.exactapp', 42, '4.2.0', 'Descriptor App');
  const crc = computeCrc32(axml);
  const nameBytes = new TextEncoder().encode('AndroidManifest.xml');

  // Local Header deliberately sets bit 3 flag (0x0008) and compSize=0, uncompSize=0
  const lhSize = 30 + nameBytes.length;
  const ddSize = 12; // CRC32 + compSize + uncompSize
  const cdEntrySize = 46 + nameBytes.length;
  const eocdSize = 22;
  const totalSize = lhSize + axml.length + ddSize + cdEntrySize + eocdSize;

  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);
  let off = 0;

  // Local File Header
  view.setUint32(off, 0x04034b50, true); off += 4;
  view.setUint16(off, 20, true); off += 2;
  view.setUint16(off, 0x0008, true); off += 2; // bit 3 Data Descriptor flag
  view.setUint16(off, 0, true); off += 2; // STORED
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint32(off, 0, true); off += 4;
  view.setUint32(off, 0, true); off += 4; // compSize = 0 in Local Header
  view.setUint32(off, 0, true); off += 4; // uncompSize = 0 in Local Header
  view.setUint16(off, nameBytes.length, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  buf.set(nameBytes, off); off += nameBytes.length;
  buf.set(axml, off); off += axml.length;

  // Data Descriptor
  view.setUint32(off, crc, true); off += 4;
  view.setUint32(off, axml.length, true); off += 4;
  view.setUint32(off, axml.length, true); off += 4;

  // Central Directory Entry
  const cdOffset = off;
  view.setUint32(off, 0x02014b50, true); off += 4;
  view.setUint16(off, 20, true); off += 2;
  view.setUint16(off, 20, true); off += 2;
  view.setUint16(off, 0x0008, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint32(off, crc, true); off += 4;
  view.setUint32(off, axml.length, true); off += 4;
  view.setUint32(off, axml.length, true); off += 4;
  view.setUint16(off, nameBytes.length, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint32(off, 0, true); off += 4;
  view.setUint32(off, 0, true); off += 4; // local header offset
  buf.set(nameBytes, off); off += nameBytes.length;

  const cdSize = off - cdOffset;
  view.setUint32(off, 0x06054b50, true); off += 4;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 0, true); off += 2;
  view.setUint16(off, 1, true); off += 2;
  view.setUint16(off, 1, true); off += 2;
  view.setUint32(off, cdSize, true); off += 4;
  view.setUint32(off, cdOffset, true); off += 4;
  view.setUint16(off, 0, true); off += 2;

  const decoded = await extractManifestMetadataFromApk(buf.buffer);
  assert.ok(decoded, 'Must decode AXML from Central Directory even when Local Header compSize is 0');
  assert.equal(decoded?.packageName, 'com.descriptor.exactapp');
  assert.equal(decoded?.versionName, '4.2.0');
  assert.equal(decoded?.versionCode, 42);

  const blob = new Blob([buf], { type: 'application/vnd.android.package-archive' });
  const meta = await inspectApkFile(blob, 'descriptor.apk');
  assert.equal(meta.packageName, 'com.descriptor.exactapp');
  assert.equal(meta.versionCode, 42);
  assert.equal(meta.fileSizeBytes, buf.length);
  assert.equal(meta.sha256.length, 64);
});


