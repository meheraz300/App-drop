import type { AppRecord, VersionRecord, DownloadStat, AuditLog, SystemConfig } from '../types';

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'Scheduled server maintenance in progress. APK downloads will resume shortly.',
  maxUploadSizeBytes: 500 * 1024 * 1024, // 500 MB
  updatedAt: new Date().toISOString(),
};

export const INITIAL_APPS: AppRecord[] = [];

export const INITIAL_VERSIONS: VersionRecord[] = [];

export const INITIAL_DOWNLOAD_STATS: DownloadStat[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
