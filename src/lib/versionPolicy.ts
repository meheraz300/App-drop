/**
 * Version policy, rollback logic, and state transition rules.
 */

import type { AppRecord, VersionRecord, VersionStatus } from '../types';

/**
 * Validates whether a state transition for an APK version is permitted.
 */
export function isAllowedVersionTransition(from: VersionStatus, to: VersionStatus): boolean {
  const allowedTransitions: Record<VersionStatus, VersionStatus[]> = {
    uploading: ['validating', 'failed'],
    validating: ['validated', 'failed'],
    validated: ['publishing', 'failed'],
    publishing: ['published', 'failed'],
    published: ['archived'],
    failed: ['uploading'], // retry
    archived: ['published'],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

/**
 * Evaluates rollback safety:
 * Target version must exist, belong to the target app, and have been successfully published.
 */
export function canRollbackToVersion(
  app: AppRecord,
  targetVersion: VersionRecord
): { allowed: boolean; reason?: string } {
  if (targetVersion.appId !== app.id) {
    return { allowed: false, reason: 'Target version does not belong to this application.' };
  }

  if (targetVersion.status !== 'published') {
    return {
      allowed: false,
      reason: `Cannot rollback to version ${targetVersion.versionName} because its status is "${targetVersion.status}".`,
    };
  }

  if (targetVersion.id === app.latestPublishedVersionId) {
    return {
      allowed: false,
      reason: `Version ${targetVersion.versionName} is already the current published version.`,
    };
  }

  return { allowed: true };
}

/**
 * Executes state update for rollback on App and Versions list in memory.
 */
export function applyRollback(
  app: AppRecord,
  targetVersionId: string,
  versions: VersionRecord[]
): { updatedApp: AppRecord; updatedVersions: VersionRecord[] } {
  const updatedApp: AppRecord = {
    ...app,
    latestPublishedVersionId: targetVersionId,
    updatedAt: new Date().toISOString(),
  };

  const updatedVersions = versions.map((v) => {
    if (v.appId !== app.id) return v;
    return {
      ...v,
      isLatest: v.id === targetVersionId,
    };
  });

  return { updatedApp, updatedVersions };
}

/**
 * Checks whether an installed version code meets the app's mandatory update requirements.
 */
export function isUpdateMandatoryForClient(
  app: AppRecord,
  clientVersionCode: number
): { updateRequired: boolean; latestVersionCode: number | null } {
  if (!app.mandatoryUpdate) {
    return { updateRequired: false, latestVersionCode: null };
  }

  const minRequired = app.minimumSupportedVersionCode || 0;
  if (clientVersionCode < minRequired) {
    return { updateRequired: true, latestVersionCode: minRequired };
  }

  return { updateRequired: false, latestVersionCode: minRequired };
}

/**
 * Calculates deletion impact for an app before permanent delete.
 */
export function calculateDeletionImpact(
  app: AppRecord,
  allVersions: VersionRecord[]
): {
  versionCount: number;
  totalStorageBytes: number;
  latestVersionName: string | null;
} {
  const appVersions = allVersions.filter((v) => v.appId === app.id);
  const totalStorageBytes = appVersions.reduce((acc, v) => acc + (v.apkSizeBytes || 0), 0);
  const latestVer = appVersions.find((v) => v.id === app.latestPublishedVersionId);

  return {
    versionCount: appVersions.length,
    totalStorageBytes,
    latestVersionName: latestVer ? latestVer.versionName : null,
  };
}
