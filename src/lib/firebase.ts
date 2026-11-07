/**
 * Firebase Client Initialization and Error Handling
 * In compliance with firebase-integration-rpc skill specifications.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal network polling warnings in sandboxed/offline environments
try {
  setLogLevel('error');
} catch {
  // Ignore if already set
}

// Initialize Firebase App instance
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure resilient Firestore instance with force long-polling & persistent cache
try {
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  }
} catch {
  // If Firestore instance has already been initialized, getFirestore will return it
}

// CRITICAL: Initialize Firestore with firestoreDatabaseId from config
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Cloud Storage
export const storage: FirebaseStorage = getStorage(app);

// Google Auth Provider configured for popups
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Detects whether a Firebase error is caused by Spark plan quota limits
 * (Free daily write/read units per project or resource-exhausted).
 */
export function isFirestoreQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const str = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'resource-exhausted' ||
    str.includes('resource-exhausted') ||
    str.toLowerCase().includes('quota exceeded') ||
    str.includes('Free daily write units') ||
    str.includes('Free daily read units') ||
    str.includes('Quota limit exceeded')
  );
}

export interface QuotaStatus {
  isExceeded: boolean;
  metric: string;
  message: string;
  resetInfo: string;
  upgradeUrl: string;
  pricingUrl: string;
  lastOccurredAt: string;
}

export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
export const FIRESTORE_PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

// Current quota status (dynamically updated if quota limits are encountered)
let currentQuotaStatus: QuotaStatus = {
  isExceeded: false,
  metric: '',
  message: '',
  resetInfo: 'Firestore free tier daily quotas reset automatically every day at midnight Pacific Time (00:00 UTC-8).',
  upgradeUrl: FIRESTORE_UPGRADE_URL,
  pricingUrl: FIRESTORE_PRICING_URL,
  lastOccurredAt: '',
};

const quotaListeners = new Set<(status: QuotaStatus) => void>();

export function getFirestoreQuotaStatus(): QuotaStatus {
  return currentQuotaStatus;
}

export function subscribeFirestoreQuota(cb: (status: QuotaStatus) => void): () => void {
  quotaListeners.add(cb);
  cb(currentQuotaStatus);
  return () => {
    quotaListeners.delete(cb);
  };
}

export function markQuotaExceeded(error: unknown): QuotaStatus {
  const errMsg = error instanceof Error ? error.message : String(error);
  currentQuotaStatus = {
    ...currentQuotaStatus,
    isExceeded: true,
    message: errMsg || currentQuotaStatus.message,
    lastOccurredAt: new Date().toISOString(),
  };
  quotaListeners.forEach((cb) => {
    try {
      cb(currentQuotaStatus);
    } catch {}
  });
  return currentQuotaStatus;
}

/**
 * Validates connection to Firestore at boot time as mandated by Firebase skill.
 */
export async function testConnection(): Promise<boolean> {
  // If daily quota has been exceeded, skip calling getDocFromServer to avoid spamming the backend
  if (currentQuotaStatus.isExceeded) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (isFirestoreQuotaExceededError(error)) {
      markQuotaExceeded(error);
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline; using persistent cache.');
      return false;
    }
    return true;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler mandated by Firebase skill.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  if (isFirestoreQuotaExceededError(error)) {
    markQuotaExceeded(error);
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ADMIN_CONFIGURED_EMAIL = 'mh3620305@gmail.com';

