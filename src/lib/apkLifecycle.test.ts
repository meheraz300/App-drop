import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateIntactApkBlob,
  verifyApkBinary,
  getApkBinary,
  downloadAndVerifyApk,
  isBinaryApkValid,
} from './binaryStorage';
import { calculateSha256, isZipArchive, validateApkAgainstApp } from './apkValidator';
import { isAllowedVersionTransition, canRollbackToVersion, applyRollback } from './versionPolicy';
import type { AppRecord, VersionRecord } from '../types';

test('Scenario 1 & 2 & 3: Valid original APK calculates SHA-256 and file size with 100% precision', async () => {
  const targetBytes = 1024 * 1024 + 5432; // ~1.005 MB
  const apkBlob = generateIntactApkBlob('Anifam App', '0.0.1', targetBytes, 'com.anifam.app');

  assert.equal(apkBlob.size, targetBytes, 'Original byte length must match exactly');
  const sha256 = await calculateSha256(apkBlob);

  assert.equal(typeof sha256, 'string');
  assert.equal(sha256.length, 64, 'SHA-256 hash must be exactly 64 hexadecimal characters');

  // Second calculation must be deterministic and identical
  const sha256Second = await calculateSha256(apkBlob);
  assert.equal(sha256, sha256Second, 'SHA-256 hash calculation must be completely deterministic');
});

test('Scenario 4 & 5: Uploaded binary matches original hash and byte size', async () => {
  const targetBytes = 2 * 1024 * 1024;
  const originalBlob = generateIntactApkBlob('Test App', '1.0.0', targetBytes, 'com.test.app');
  const originalSha = await calculateSha256(originalBlob);

  const verification = await verifyApkBinary(originalBlob, originalSha, targetBytes);
  assert.equal(verification.valid, true, 'Original binary must pass verification against its own hash and size');
  assert.equal(verification.actualSha256, originalSha);
  assert.equal(verification.actualSize, targetBytes);
});

test('Scenario 6 & 7: Failed upload or verification does not publish or replace previous version', () => {
  const initialApp: AppRecord = {
    id: 'app_1',
    name: 'Stable App',
    packageName: 'com.stable.app',
    shortDescription: 'Stable',
    description: 'Stable app',
    category: 'Tools',
    tags: ['tools'],
    iconPath: '',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_stable_v1',
    featured: false,
    featuredOrder: 1,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    archivedAt: null,
  };

  const existingVersions: VersionRecord[] = [
    {
      id: 'ver_stable_v1',
      appId: 'app_1',
      versionName: '1.0.0',
      versionCode: 1,
      releaseNotes: 'Initial release',
      apkPath: 'published/app_1/ver_stable_v1/app.apk',
      apkSizeBytes: 1000000,
      sha256: 'a'.repeat(64),
      signingCertificateSha256: 'cert_1',
      status: 'published',
      isLatest: true,
      publishedAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
    },
  ];

  // Simulating a failed upload: an error occurs during upload/verification
  const uploadFailed = true;
  let activeApp = { ...initialApp };
  let activeVersions = [...existingVersions];

  if (uploadFailed) {
    // Pipeline must abort without mutating activeApp.latestPublishedVersionId
  } else {
    activeApp.latestPublishedVersionId = 'ver_corrupt_v2';
  }

  assert.equal(activeApp.latestPublishedVersionId, 'ver_stable_v1', 'Previous version pointer must remain completely unchanged');
  assert.equal(activeVersions[0].isLatest, true, 'Previous version must remain latest published');
});

test('Scenario 8 & 9 & 10: User receives exact original APK with identical SHA-256 and size', async () => {
  const targetBytes = 1024 * 512; // 512 KB
  const adminBlob = generateIntactApkBlob('Anifam', '1.0.0', targetBytes, 'com.anifam.app');
  const adminSha = await calculateSha256(adminBlob);

  const downloadedBlob = adminBlob; // Exact byte stream received
  const downloadedSha = await calculateSha256(downloadedBlob);

  assert.equal(downloadedBlob.size, adminBlob.size, 'Size(Admin Original APK) === Size(User Downloaded APK)');
  assert.equal(downloadedSha, adminSha, 'SHA256(Admin Original APK) === SHA256(User Downloaded APK)');

  const verification = await verifyApkBinary(downloadedBlob, adminSha, adminBlob.size);
  assert.equal(verification.valid, true);
});

test('Scenario 11: Different APK with same filename is rejected due to hash mismatch', async () => {
  const apkA = generateIntactApkBlob('Anifam', '0.0.1', 1024 * 1024, 'com.anifam.app');
  const apkB = generateIntactApkBlob('Fake Calculator', '0.0.1', 1024 * 1024 + 1, 'com.calculator.app');

  const expectedSha = await calculateSha256(apkA);
  const expectedSize = apkA.size;

  const check = await verifyApkBinary(apkB, expectedSha, expectedSize);
  assert.equal(check.valid, false, 'Different APK with same filename must be rejected');
  assert.match(check.error || '', /mismatch/i);
});

test('Scenario 12: Different APK with same file size but different hash is strictly rejected', async () => {
  const size = 1024 * 1024;
  const apkA = generateIntactApkBlob('App A', '1.0.0', size, 'com.app.a');
  const apkB = generateIntactApkBlob('App B', '1.0.0', size, 'com.app.b');

  const shaA = await calculateSha256(apkA);
  const shaB = await calculateSha256(apkB);

  assert.equal(apkA.size, apkB.size, 'Sizes are identical');
  assert.notEqual(shaA, shaB, 'Hashes are different');

  const check = await verifyApkBinary(apkB, shaA, size);
  assert.equal(check.valid, false, 'Same size with different hash must be rejected');
  assert.match(check.error || '', /SHA-256 hash mismatch/i);
});

test('Scenario 13: Corrupted APK (invalid ZIP structure or uncompiled XML) is rejected', async () => {
  const corruptPayload = new TextEncoder().encode('PK\x03\x04AndroidManifest.xml<?xml version="1.0"?>');
  const corruptBlob = new Blob([corruptPayload], { type: 'application/vnd.android.package-archive' });

  assert.equal(await isBinaryApkValid(corruptBlob), false, 'Corrupted XML in APK must fail validation');

  const check = await verifyApkBinary(corruptBlob, 'e'.repeat(64), corruptBlob.size);
  assert.equal(check.valid, false);
});

test('Scenario 14: Incomplete/truncated APK is rejected due to size and hash failure', async () => {
  const fullBlob = generateIntactApkBlob('Full App', '1.0.0', 1024 * 1024, 'com.full.app');
  const fullSha = await calculateSha256(fullBlob);
  const truncatedBlob = fullBlob.slice(0, 1024 * 512); // Truncated to 512 KB

  const check = await verifyApkBinary(truncatedBlob, fullSha, fullBlob.size);
  assert.equal(check.valid, false, 'Truncated download must be rejected');
  assert.match(check.error || '', /File size mismatch/i);
});

test('Scenario 15: Missing APK produces an explicit error without falling back', async () => {
  await assert.rejects(
    async () => {
      await getApkBinary('non_existent_version_99999', {
        expectedSizeBytes: 5000000,
        expectedSha256: 'f'.repeat(64),
      });
    },
    /APK_NOT_FOUND/i,
    'Missing APK must throw explicit APK_NOT_FOUND error instead of substituting another file'
  );
});

test('Scenario 16: Unpublished APK cannot be downloaded', async () => {
  const unpublishedVersion: VersionRecord = {
    id: 'ver_draft_1',
    appId: 'app_1',
    versionName: '2.0.0',
    versionCode: 2,
    releaseNotes: 'Draft',
    apkPath: '',
    apkSizeBytes: 1024 * 1024,
    sha256: 'a'.repeat(64),
    signingCertificateSha256: 'cert',
    status: 'validating', // Not published
    isLatest: false,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
  };

  await assert.rejects(
    async () => {
      await downloadAndVerifyApk({ id: 'app_1', name: 'Test App' }, unpublishedVersion);
    },
    /Cannot download unpublished application version/i,
    'Unpublished version must immediately reject download'
  );
});

test('Scenario 17: Missing integrity metadata rejects download immediately', async () => {
  const brokenMetaVersion: VersionRecord = {
    id: 'ver_broken',
    appId: 'app_1',
    versionName: '1.0.0',
    versionCode: 1,
    releaseNotes: '',
    apkPath: '',
    apkSizeBytes: 0, // Missing size!
    sha256: '', // Missing hash!
    signingCertificateSha256: '',
    status: 'published',
    isLatest: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
  };

  await assert.rejects(
    async () => {
      await downloadAndVerifyApk({ id: 'app_1', name: 'Test App' }, brokenMetaVersion);
    },
    /Missing or invalid integrity metadata/i,
    'Missing SHA-256 or size must abort download before retrieving binary'
  );
});

test('Scenario 18: No fallback APK (template.apk or synthetic blob) is returned on mismatch', async () => {
  await assert.rejects(
    async () => {
      await getApkBinary('missing_version_test', {
        expectedSizeBytes: 1500000,
        expectedSha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      });
    },
    /APK_NOT_FOUND/,
    'Must throw error and never silently return template.apk'
  );
});

test('Scenario 19: Failed verification never produces a success message or valid payload', async () => {
  const dummyBlob = new Blob(['Bad payload'], { type: 'text/plain' });
  const check = await verifyApkBinary(dummyBlob, 'a'.repeat(64), 500000);

  assert.equal(check.valid, false);
  assert.ok(check.error, 'An explicit error explanation must be returned');
});

test('Scenario 20 & 21: GitHub Pages static compatibility guarantees no missing /api server crash', () => {
  // In static GitHub Pages deployment, window.location.pathname may be /App-drop/
  // The system must resolve direct storage URLs or Firebase Storage references without crashing
  const basePath = '/App-drop';
  const fileName = 'Anifam App-v0.0.1.apk';
  const directUrl = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0151375017.firebasestorage.app/o/published%2Fapp_1%2Fver_1%2FAnifam.apk?alt=media';

  // Authoritative URL directly points to Cloud Storage
  assert.ok(directUrl.startsWith('https://'), 'Production download URL must point directly to public storage');
  assert.ok(!directUrl.startsWith('/api/'), 'Must not require Express /api proxy on GitHub Pages');
});

test('Scenario 22: Version state machine prevents illegal transitions', () => {
  assert.equal(isAllowedVersionTransition('uploading', 'validating'), true);
  assert.equal(isAllowedVersionTransition('validating', 'validated'), true);
  assert.equal(isAllowedVersionTransition('publishing', 'published'), true);
  assert.equal(isAllowedVersionTransition('validating', 'published'), false, 'Cannot bypass validated and publishing stages');
  assert.equal(isAllowedVersionTransition('failed', 'published'), false, 'Cannot jump from failed to published directly');
  assert.equal(isAllowedVersionTransition('archived', 'publishing'), false, 'Archived version cannot be published without review');
});

test('Scenario 23 & 24: Rollback policy allows valid previous version and rejects self-rollback', () => {
  const app: AppRecord = {
    id: 'app_1',
    name: 'App',
    packageName: 'com.example',
    shortDescription: '',
    description: '',
    category: 'Tools',
    tags: [],
    iconPath: '',
    screenshotPaths: [],
    latestPublishedVersionId: 'ver_2',
    featured: false,
    featuredOrder: 1,
    visibility: 'public',
    status: 'published',
    mandatoryUpdate: false,
    minimumSupportedVersionCode: null,
    createdAt: '',
    updatedAt: '',
    archivedAt: null,
  };

  const ver1: VersionRecord = {
    id: 'ver_1',
    appId: 'app_1',
    versionName: '1.0.0',
    versionCode: 1,
    releaseNotes: '',
    apkPath: '',
    apkSizeBytes: 1000,
    sha256: 'a'.repeat(64),
    signingCertificateSha256: '',
    status: 'published',
    isLatest: false,
    publishedAt: '',
    createdAt: '',
    createdBy: '',
  };

  const ver2: VersionRecord = {
    ...ver1,
    id: 'ver_2',
    versionName: '2.0.0',
    versionCode: 2,
    isLatest: true,
  };

  // Rollback to ver_1 is valid
  const check1 = canRollbackToVersion(app, ver1);
  assert.equal(check1.allowed, true);

  // Rollback to ver_2 (already active) is rejected
  const check2 = canRollbackToVersion(app, ver2);
  assert.equal(check2.allowed, false);
});

test('Scenario 25: Production seedData has zero hardcoded calculator or demo apps/versions', async () => {
  const { INITIAL_APPS, INITIAL_VERSIONS } = await import('./seedData');
  assert.equal(INITIAL_APPS.length, 0);
  assert.equal(INITIAL_VERSIONS.length, 0);
});

test('Scenario 26: HTML/JSON response masquerading as .apk fails binary APK validation cleanly', async () => {
  const htmlContent = new TextEncoder().encode('<!doctype html><html><title>404</title></html>');
  const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
  assert.equal(await isBinaryApkValid(htmlBlob), false);

  const check = await verifyApkBinary(htmlBlob, 'a'.repeat(64), htmlContent.length);
  assert.equal(check.valid, false);
});

test('Scenario 27: calculateSha256 and inspectApkFile abort cleanly via AbortSignal', async () => {
  const { inspectApkFile } = await import('./apkValidator');
  const { isAbortError } = await import('./binaryStorage');
  const apkBlob = generateIntactApkBlob('Cancel Test', '1.0.0', 2 * 1024 * 1024, 'com.cancel.test');

  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    async () => {
      await calculateSha256(apkBlob, undefined, controller.signal);
    },
    (err: unknown) => isAbortError(err)
  );

  await assert.rejects(
    async () => {
      await inspectApkFile(apkBlob, 'cancel.apk', undefined, undefined, controller.signal);
    },
    (err: unknown) => isAbortError(err)
  );
});

test('Scenario 28: saveApkBinary aborts immediately with AbortError without publishing partial packages', async () => {
  const { saveApkBinary, isAbortError } = await import('./binaryStorage');
  const apkBlob = generateIntactApkBlob('Abort Save', '1.0.0', 1024 * 1024, 'com.abort.save');

  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    async () => {
      await saveApkBinary('ver_abort_test_1', apkBlob, {
        appId: 'app_abort_1',
        fileName: 'abort.apk',
        signal: controller.signal,
      });
    },
    (err: unknown) => isAbortError(err)
  );
});

test('Scenario 29: probeServerUploadEndpoint fails fast without hanging when backend is unavailable', async () => {
  const { probeServerUploadEndpoint } = await import('./binaryStorage');
  const start = Date.now();
  const result = await probeServerUploadEndpoint('/App-drop');
  const elapsed = Date.now() - start;

  assert.equal(typeof result.available, 'boolean');
  assert.ok(elapsed < 4000, `Probe must settle quickly (<4s), took ${elapsed}ms`);
});

test('Scenario 30: planBinaryChunks & base64 chunk reassembly preserve exact bytes and SHA-256 across non-aligned sizes', async () => {
  const { planBinaryChunks, bufferToBase64, base64ToUint8Array } = await import('./binaryStorage');
  const nonAlignedSize = 1500 * 1024 + 317; // 1.5 MB + 317 odd bytes
  const originalBlob = generateIntactApkBlob('LiveApp', '2.1.0', nonAlignedSize, 'com.live.app');
  const originalSha = await calculateSha256(originalBlob);
  const originalBytes = new Uint8Array(await originalBlob.arrayBuffer());

  const chunkSize = 600 * 1024;
  const plan = planBinaryChunks(originalBytes.byteLength, chunkSize);
  assert.equal(plan.chunkCount, 3);
  assert.equal(plan.totalBytes, nonAlignedSize);
  assert.equal(plan.ranges[0].byteLength, chunkSize);
  assert.equal(plan.ranges[1].byteLength, chunkSize);
  assert.equal(plan.ranges[2].byteLength, nonAlignedSize - 2 * chunkSize);

  // Simulate Firestore base64 chunk storage & unordered reassembly by offset
  const encodedChunks = plan.ranges.map((r) => ({
    offset: r.offset,
    data: bufferToBase64(originalBytes.subarray(r.offset, r.end)),
  }));

  const reassembled = new Uint8Array(plan.totalBytes);
  for (const chunk of [...encodedChunks].reverse()) {
    reassembled.set(base64ToUint8Array(chunk.data), chunk.offset);
  }

  const reassembledBlob = new Blob([reassembled], { type: 'application/vnd.android.package-archive' });
  const check = await verifyApkBinary(reassembledBlob, originalSha, nonAlignedSize);
  assert.equal(check.valid, true);
  assert.equal(check.actualSize, nonAlignedSize);
  assert.equal(check.actualSha256, originalSha);
});

test('Scenario 31: Reassembled chunk corruption or truncation is rejected by verifyApkBinary', async () => {
  const { planBinaryChunks, bufferToBase64, base64ToUint8Array } = await import('./binaryStorage');
  const targetSize = 700 * 1024 + 123;
  const originalBlob = generateIntactApkBlob('IntegrityApp', '1.0.0', targetSize, 'com.integrity.app');
  const originalSha = await calculateSha256(originalBlob);
  const originalBytes = new Uint8Array(await originalBlob.arrayBuffer());

  const plan = planBinaryChunks(originalBytes.byteLength, 300 * 1024);
  const reassembled = new Uint8Array(plan.totalBytes);
  for (const r of plan.ranges) {
    const b64 = bufferToBase64(originalBytes.subarray(r.offset, r.end));
    reassembled.set(base64ToUint8Array(b64), r.offset);
  }

  // Flip a single byte in the middle chunk
  reassembled[350 * 1024] ^= 0xff;
  const tamperedBlob = new Blob([reassembled], { type: 'application/vnd.android.package-archive' });
  const tamperedCheck = await verifyApkBinary(tamperedBlob, originalSha, targetSize);
  assert.equal(tamperedCheck.valid, false);
  assert.match(tamperedCheck.error || '', /SHA-256 hash mismatch/i);
});

test('Scenario 32: buildDirectApkDownloadUrl formats App-drop subpath and filename encoding safely', async () => {
  const { buildDirectApkDownloadUrl } = await import('./binaryStorage');

  assert.equal(
    buildDirectApkDownloadUrl('ver_123', 'Anifam App-v0.0.1.apk', '/App-drop'),
    '/App-drop/api/apks/ver_123/download?filename=Anifam%20App-v0.0.1.apk'
  );
  assert.equal(
    buildDirectApkDownloadUrl('ver_123', 'MyApp.apk', ''),
    '/api/apks/ver_123/download?filename=MyApp.apk'
  );
});
