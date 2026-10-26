import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedVersionTransition,
  canRollbackToVersion,
  applyRollback,
  isUpdateMandatoryForClient,
  calculateDeletionImpact,
} from './versionPolicy';
import type { AppRecord, VersionRecord } from '../types';

const mockApp: AppRecord = {
  id: 'app_1',
  name: 'Test App',
  packageName: 'com.test.app',
  shortDescription: 'Short desc',
  description: 'Full desc',
  category: 'Tools',
  tags: ['utility'],
  iconPath: '/icon.png',
  screenshotPaths: [],
  latestPublishedVersionId: 'ver_2',
  featured: false,
  featuredOrder: 0,
  visibility: 'public',
  status: 'published',
  mandatoryUpdate: true,
  minimumSupportedVersionCode: 10,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  archivedAt: null,
};

const mockVersions: VersionRecord[] = [
  {
    id: 'ver_1',
    appId: 'app_1',
    versionName: '1.0.0',
    versionCode: 5,
    releaseNotes: 'Initial release',
    apkPath: 'published/app_1/ver_1/app.apk',
    apkSizeBytes: 15000000,
    sha256: 'a'.repeat(64),
    signingCertificateSha256: 'B'.repeat(32),
    status: 'published',
    isLatest: false,
    publishedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin_1',
  },
  {
    id: 'ver_2',
    appId: 'app_1',
    versionName: '1.1.0',
    versionCode: 10,
    releaseNotes: 'Update with fixes',
    apkPath: 'published/app_1/ver_2/app.apk',
    apkSizeBytes: 16000000,
    sha256: 'b'.repeat(64),
    signingCertificateSha256: 'B'.repeat(32),
    status: 'published',
    isLatest: true,
    publishedAt: '2026-02-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    createdBy: 'admin_1',
  },
];

test('isAllowedVersionTransition enforces valid state machine progression', () => {
  assert.equal(isAllowedVersionTransition('uploading', 'validating'), true);
  assert.equal(isAllowedVersionTransition('validating', 'validated'), true);
  assert.equal(isAllowedVersionTransition('validated', 'publishing'), true);
  assert.equal(isAllowedVersionTransition('publishing', 'published'), true);
  assert.equal(isAllowedVersionTransition('uploading', 'published'), false); // cannot jump
});

test('canRollbackToVersion validates rollback preconditions', () => {
  // ver_1 is valid target
  const rollbackCheck1 = canRollbackToVersion(mockApp, mockVersions[0]);
  assert.equal(rollbackCheck1.allowed, true);

  // ver_2 is already latest
  const rollbackCheck2 = canRollbackToVersion(mockApp, mockVersions[1]);
  assert.equal(rollbackCheck2.allowed, false);
  assert.match(rollbackCheck2.reason || '', /already the current published version/);
});

test('applyRollback updates app pointer and version isLatest flags', () => {
  const { updatedApp, updatedVersions } = applyRollback(mockApp, 'ver_1', mockVersions);
  assert.equal(updatedApp.latestPublishedVersionId, 'ver_1');
  assert.equal(updatedVersions.find((v) => v.id === 'ver_1')?.isLatest, true);
  assert.equal(updatedVersions.find((v) => v.id === 'ver_2')?.isLatest, false);
});

test('isUpdateMandatoryForClient correctly triggers update flags', () => {
  const clientOutdated = isUpdateMandatoryForClient(mockApp, 5);
  assert.equal(clientOutdated.updateRequired, true);

  const clientUpToDate = isUpdateMandatoryForClient(mockApp, 10);
  assert.equal(clientUpToDate.updateRequired, false);
});

test('calculateDeletionImpact tallies versions and storage accurately', () => {
  const impact = calculateDeletionImpact(mockApp, mockVersions);
  assert.equal(impact.versionCount, 2);
  assert.equal(impact.totalStorageBytes, 31000000);
  assert.equal(impact.latestVersionName, '1.1.0');
});
