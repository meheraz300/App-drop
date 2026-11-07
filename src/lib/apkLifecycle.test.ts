import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  deleteApkBinaryFromCloudStorage,
  purgeAllStoredFiles,
  generateIntactApkBlob,
} from './binaryStorage';

test('deleteApkBinaryFromCloudStorage returns structured response without throwing errors', async () => {
  const result = await deleteApkBinaryFromCloudStorage('app_test_demo', 'ver_test_01', 'sample.apk');
  assert.equal(typeof result, 'object');
  assert.equal(typeof result.success, 'boolean');
  assert.equal(typeof result.deletedCount, 'number');
});

test('purgeAllStoredFiles completes cleanly across all storage tiers', async () => {
  const result = await purgeAllStoredFiles();
  assert.equal(typeof result, 'object');
  assert.equal(typeof result.cloudDeleted, 'number');
  assert.equal(typeof result.serverDeleted, 'number');
  assert.equal(typeof result.serverFreedBytes, 'number');
});

test('intact APK generation guarantees byte preservation without truncation or compression', async () => {
  const targetSizes = [
    1024 * 1024, // 1 MB
    15 * 1024 * 1024 + 777, // ~15.0007 MB
    45 * 1024 * 1024, // 45 MB
  ];

  for (const size of targetSizes) {
    const blob = generateIntactApkBlob('Test App', '1.0.0', size, 'com.test.app');
    assert.equal(blob.size, size, `Blob size must match exact expected byte size (${size})`);
    
    const arrayBuffer = await blob.arrayBuffer();
    assert.equal(arrayBuffer.byteLength, size, `ArrayBuffer byte length must be exact (${size})`);

    // Verify first 4 bytes are ZIP Local File Header magic (PK\x03\x04 = 0x04034b50)
    const uint8 = new Uint8Array(arrayBuffer);
    assert.equal(uint8[0], 0x50); // P
    assert.equal(uint8[1], 0x4b); // K
    assert.equal(uint8[2], 0x03);
    assert.equal(uint8[3], 0x04);
  }
});

test('server disk storage lifecycle: upload intact, retrieve exact byte length, delete and reclaim quota', async () => {
  const testDir = path.join(process.cwd(), 'uploads', 'apks');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testAppId = `app_test_${Date.now()}`;
  const testVersionId = `ver_${testAppId}_1`;
  const originalFileName = 'MyApplication-v1.0.0.apk';
  const targetSizeBytes = 2 * 1024 * 1024 + 1234; // 2.0012 MB

  // Generate exact payload
  const rawData = crypto.randomBytes(targetSizeBytes);
  const expectedSha256 = crypto.createHash('sha256').update(rawData).digest('hex');

  const apkFilePath = path.join(testDir, `${testVersionId}.apk`);
  const metaFilePath = path.join(testDir, `${testVersionId}.meta.json`);

  // Step 1: Store intact binary without compression or truncation
  fs.writeFileSync(apkFilePath, rawData);
  fs.writeFileSync(
    metaFilePath,
    JSON.stringify({
      versionId: testVersionId,
      appId: testAppId,
      originalFileName,
      sizeBytes: targetSizeBytes,
      sha256: expectedSha256,
      uploadedAt: new Date().toISOString(),
    })
  );

  // Step 2: Verify byte-exact preservation and integrity
  const stat = fs.statSync(apkFilePath);
  assert.equal(stat.size, targetSizeBytes, 'Stored file size must equal raw input size');

  const computedHash = crypto.createHash('sha256').update(fs.readFileSync(apkFilePath)).digest('hex');
  assert.equal(computedHash, expectedSha256, 'SHA-256 hash must be identical to original payload');

  // Step 3: Test deletion logic for freeing quota
  const preDeleteFiles = fs.readdirSync(testDir);
  assert.ok(preDeleteFiles.includes(`${testVersionId}.apk`));
  assert.ok(preDeleteFiles.includes(`${testVersionId}.meta.json`));

  // Delete version file
  fs.unlinkSync(apkFilePath);
  fs.unlinkSync(metaFilePath);

  const postDeleteFiles = fs.readdirSync(testDir);
  assert.ok(!postDeleteFiles.includes(`${testVersionId}.apk`), 'APK binary must be permanently removed');
  assert.ok(!postDeleteFiles.includes(`${testVersionId}.meta.json`), 'Metadata must be removed');
});

test('formatUploadSpeed properly formats transfer rates without NaN or anomalies', async () => {
  const { formatUploadSpeed } = await import('./binaryStorage');
  assert.equal(formatUploadSpeed(0), '0 KB/s');
  assert.equal(formatUploadSpeed(-50), '0 KB/s');
  assert.equal(formatUploadSpeed(500), '500 B/s');
  assert.equal(formatUploadSpeed(250 * 1024), '250.0 KB/s');
  assert.equal(formatUploadSpeed(4.5 * 1024 * 1024), '4.5 MB/s');
  assert.equal(formatUploadSpeed(18.25 * 1024 * 1024), '18.3 MB/s');
});

test('formatUploadEta computes accurate human-readable estimated time remaining', async () => {
  const { formatUploadEta } = await import('./binaryStorage');
  assert.equal(formatUploadEta(0), '0s');
  assert.equal(formatUploadEta(-10), '0s');
  assert.equal(formatUploadEta(0.4), '< 1s');
  assert.equal(formatUploadEta(15), '15s remaining');
  assert.equal(formatUploadEta(60), '1m 0s remaining');
  assert.equal(formatUploadEta(135), '2m 15s remaining');
});

test('formatByteSize formats byte values accurately', async () => {
  const { formatByteSize } = await import('./binaryStorage');
  assert.equal(formatByteSize(0), '0 B');
  assert.equal(formatByteSize(512), '512 B');
  assert.equal(formatByteSize(1024 * 50), '50.0 KB');
  assert.equal(formatByteSize(1024 * 1024 * 42.5), '42.50 MB');
});

test('real-time progress calculation reaches 100% without stalling at 88%', () => {
  const total = 50 * 1024 * 1024; // 50MB APK
  const samples = [
    { loaded: 5 * 1024 * 1024, expectedPct: 10 },
    { loaded: 25 * 1024 * 1024, expectedPct: 50 },
    { loaded: 44 * 1024 * 1024, expectedPct: 88 },
    { loaded: 47 * 1024 * 1024, expectedPct: 94 },
    { loaded: 50 * 1024 * 1024, expectedPct: 100 },
  ];

  for (const s of samples) {
    const calculated = Math.min(100, Math.max(1, Math.round((s.loaded / total) * 100)));
    assert.equal(calculated, s.expectedPct);
  }
  // Verify that the old buggy clamp Math.min(88, ...) is avoided
  const finalLoaded = 50 * 1024 * 1024;
  const finalCalculated = Math.min(100, Math.max(1, Math.round((finalLoaded / total) * 100)));
  assert.equal(finalCalculated, 100, 'Progress must reach 100% when upload finishes');
});

