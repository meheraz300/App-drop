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
 * Validates connection to Firestore at boot time as mandated by Firebase skill.
 * Implements defensive timeout guard to gracefully handle offline/sandboxed environments.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const checkDoc = getDoc(doc(db, 'systemConfig', 'global'));
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('the client is offline (connection timeout)')), 2500)
    );
    await Promise.race([checkDoc, timeout]);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return false;
    }
    // Expected in initial security state or empty database
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ADMIN_CONFIGURED_EMAIL = 'mh3620305@gmail.com';
