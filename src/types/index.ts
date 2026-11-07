/**
 * Core type definitions for AppDrop - Android APK Distribution Platform
 */

export type AppVisibility = 'public' | 'unlisted';
export type AppStatus = 'published' | 'draft' | 'archived';

export type VersionStatus =
  | 'uploading'
  | 'validating'
  | 'validated'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'archived';

export type UploadSessionStatus =
  | 'created'
  | 'uploading'
  | 'uploaded'
  | 'validating'
  | 'validated'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export interface AppRecord {
  id: string;
  name: string;
  packageName: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  iconPath: string;
  screenshotPaths: string[];
  latestPublishedVersionId: string | null;
  featured: boolean;
  featuredOrder: number;
  visibility: AppVisibility;
  status: AppStatus;
  mandatoryUpdate: boolean;
  minimumSupportedVersionCode: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface VersionRecord {
  id: string;
  appId: string;
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  apkPath: string;
  apkSizeBytes: number;
  sha256: string;
  signingCertificateSha256: string;
  status: VersionStatus;
  isLatest: boolean;
  publishedAt: string | null;
  createdAt: string;
  createdBy: string;
  downloadUrl?: string;
}

export interface UploadSession {
  id: string;
  appId: string;
  versionId: string;
  status: UploadSessionStatus;
  originalFileName: string;
  expectedSizeBytes: number;
  uploadPath: string;
  uploadedAt: string | null;
  validationStartedAt: string | null;
  validatedAt: string | null;
  errorCode: string | null;
  errorMessage?: string;
  createdAt: string;
}

export interface DownloadEvent {
  id: string;
  appId: string;
  versionId: string;
  eventType: 'download_url_issued';
  createdAt: string;
  requestId: string;
}

export interface DownloadStat {
  id: string;
  date: string; // YYYY-MM-DD
  appId: string;
  versionId: string;
  requestCount: number;
  updatedAt: string;
}

export interface DeploymentEvent {
  id: string;
  event: 'app.published' | 'app.updated' | 'app.deleted' | 'pipeline.manual_trigger';
  appId?: string;
  appName?: string;
  version?: string;
  triggeredAt: string;
  actorEmail?: string;
  status: 'triggered' | 'queued' | 'completed' | 'failed';
  target: string;
  details?: string;
}

export interface DeploymentConfig {
  autoDeployOnMutation: boolean;
  githubRepo?: string;
  githubToken?: string;
  deployHookUrl?: string;
  lastTriggeredAt?: string;
  lastEvent?: string;
  lastStatus?: string;
  lastDetails?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action:
    | 'app.created'
    | 'app.updated'
    | 'app.archived'
    | 'app.restored'
    | 'app.deleted'
    | 'version.uploaded'
    | 'version.validated'
    | 'version.published'
    | 'version.rollback'
    | 'maintenance.toggled'
    | 'config.updated'
    | 'pipeline.triggered';
  appId: string;
  versionId: string | null;
  createdAt: string;
  requestId: string;
  result: 'success' | 'failure';
  details: string;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxUploadSizeBytes: number;
  updatedAt: string;
  deploymentConfig?: DeploymentConfig;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

export interface ParsedApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
  fileSizeBytes: number;
  sha256: string;
  signatureScheme: string;
  signingCertificateSha256: string;
  isValidZip: boolean;
  permissions: string[];
}

export interface UploadProgressInfo {
  stage: 'idle' | 'uploading' | 'validating' | 'publishing' | 'completed' | 'error';
  percentage: number;
  details?: string;
  error?: string;
  verifiedMetadata?: any;
  speedFormatted?: string;
  etaFormatted?: string;
  transferredFormatted?: string;
  speedBytesPerSec?: number;
  etaSeconds?: number;
}

