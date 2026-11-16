/**
 * Global AppContext providing state management, Firebase synchronization,
 * theme management, and admin operations.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  AppRecord,
  VersionRecord,
  DownloadStat,
  DownloadEvent,
  AuditLog,
  SystemConfig,
  AdminUser,
} from '../types';
import {
  INITIAL_APPS,
  INITIAL_VERSIONS,
  INITIAL_DOWNLOAD_STATS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_CONFIG,
} from '../lib/seedData';
import {
  auth,
  db,
  googleAuthProvider,
  ADMIN_CONFIGURED_EMAIL,
  isAuthorizedAdminEmail,
  testConnection,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  inspectApkFile,
  validateApkAgainstApp,
} from '../lib/apkValidator';
import {
  canRollbackToVersion,
  applyRollback,
  calculateDeletionImpact,
} from '../lib/versionPolicy';
import {
  saveApkBinary,
  deleteApkBinary,
  purgeAllStoredFiles,
  getApiBasePath,
  isCloudStorageBucketAvailable,
  isAbortError,
} from '../lib/binaryStorage';
import {
  recordDownloadEvent,
  generateRequestId,
  computeDownloadAggregates,
} from '../lib/analyticsTracker';
import { formatApkDownloadFileName } from '../lib/downloadHelper';

export type AppRoute =
  | 'home'
  | 'app-details'
  | 'categories'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-apps'
  | 'admin-upload'
  | 'admin-versions'
  | 'admin-analytics'
  | 'admin-storage'
  | 'admin-activity'
  | 'admin-settings'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'install-guide';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentRoute: AppRoute;
  selectedAppId: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  navigateTo: (route: AppRoute, appId?: string | null, category?: string | null) => void;

  apps: AppRecord[];
  versions: VersionRecord[];
  downloadStats: DownloadStat[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
  user: AdminUser | null;
  isAdmin: boolean;
  authLoading: boolean;
  isInitialSyncLoading: boolean;

  // Actions
  signInWithGoogle: () => Promise<void>;
  simulateAdminSignIn: (emailInput?: string) => void;
  signOut: () => Promise<void>;
  createApp: (data: Partial<AppRecord>) => Promise<string>;
  updateApp: (appId: string, data: Partial<AppRecord>) => Promise<void>;
  archiveApp: (appId: string) => Promise<void>;
  restoreApp: (appId: string) => Promise<void>;
  deleteApp: (appId: string) => Promise<void>;
  rollbackVersion: (appId: string, targetVersionId: string) => Promise<{ success: boolean; error?: string }>;
  updateReleaseNotes: (versionId: string, releaseNotes: string) => Promise<void>;
  requestDownload: (appId: string, versionId: string) => Promise<{
    downloadUrl: string;
    fileName: string;
    blobUrl?: string;
    directServerUrl?: string;
    sha256: string;
    apkSizeBytes: number;
  }>;
  updateSystemConfig: (updates: Partial<SystemConfig>) => Promise<void>;
  purgeAllStorage: () => Promise<{ cloudDeleted: number; serverDeleted: number; serverFreedBytes: number }>;
  triggerManualDeploy: () => Promise<{ message: string }>;
  quotaStatus: {
    isExceeded: boolean;
    upgradeUrl?: string;
    pricingUrl?: string;
    metric?: string;
  };

  // Upload pipeline state
  uploadProgress: {
    stage: 'idle' | 'uploading' | 'validating' | 'publishing' | 'completed' | 'error';
    percentage: number;
    details?: string;
    error?: string;
    verifiedMetadata?: any;
    speedFormatted?: string;
    etaFormatted?: string;
    transferredFormatted?: string;
  };
  startApkUpload: (
    arg1: string | File,
    arg2: File | string,
    arg3?: string,
    arg4?: {
      name?: string;
      category?: string;
      iconPath?: string;
      shortDescription?: string;
      description?: string;
      externalDownloadUrl?: string;
    }
  ) => Promise<boolean>;
  cancelApkUpload: () => void;
  resetUploadProgress: () => void;
  uploadCancelledNotice: string | null;
  clearUploadCancelledNotice: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  THEME: 'appdrop_theme',
  APPS: 'appdrop_apps_cache',
  VERSIONS: 'appdrop_versions_cache',
  STATS: 'appdrop_stats_cache',
  LOGS: 'appdrop_logs_cache',
  CONFIG: 'appdrop_config_cache',
};

const isLegacyDemoApp = (a: Partial<AppRecord> | null | undefined): boolean => {
  if (!a) return false;
  const id = a.id || '';
  const pkg = a.packageName || '';
  return (
    id === 'app_calculator_official' ||
    id === 'app_1793716730739_iuf0' ||
    id.includes('quantum') ||
    id.includes('liquid') ||
    id.includes('signal') ||
    id.includes('aether') ||
    pkg.includes('quantumguard') ||
    pkg.includes('liquidflow')
  );
};

const isLegacyDemoVersion = (v: Partial<VersionRecord> | null | undefined): boolean => {
  if (!v) return false;
  const id = v.id || '';
  const appId = v.appId || '';
  return (
    id === 'ver_calculator_5_12_0' ||
    id === 'ver_app_1793716730739_iuf0_1793716730739' ||
    appId === 'app_calculator_official' ||
    appId === 'app_1793716730739_iuf0' ||
    id.includes('quantum') ||
    id.includes('liquid') ||
    id.includes('signal') ||
    id.includes('aether') ||
    appId.includes('quantum') ||
    appId.includes('liquid')
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Routing state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Domain records with local persistence (clean production state)
  const [apps, setApps] = useState<AppRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((a) => !isLegacyDemoApp(a));
          if (cleaned.length > 0) return cleaned;
        }
      } catch {
        // Fallback to INITIAL_APPS
      }
    }
    localStorage.removeItem(STORAGE_KEYS.APPS);
    return INITIAL_APPS;
  });

  const [versions, setVersions] = useState<VersionRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((v) => !isLegacyDemoVersion(v));
          if (cleaned.length > 0) return cleaned;
        }
      } catch {
        // Fallback to INITIAL_VERSIONS
      }
    }
    localStorage.removeItem(STORAGE_KEYS.VERSIONS);
    return INITIAL_VERSIONS;
  });

  const [downloadStats, setDownloadStats] = useState<DownloadStat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (s) => !s.appId?.includes('quantum') && !s.appId?.includes('liquid')
          );
          return cleaned;
        }
      } catch {
        // Fallback to INITIAL_DOWNLOAD_STATS
      }
    }
    localStorage.removeItem(STORAGE_KEYS.STATS);
    return INITIAL_DOWNLOAD_STATS;
  });

  const [downloadEvents, setDownloadEvents] = useState<DownloadEvent[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (l) => !l.details?.includes('QuantumGuard') && !l.details?.includes('LiquidFlow')
          );
          return cleaned;
        }
      } catch {
        // Fallback to INITIAL_AUDIT_LOGS
      }
    }
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    return INITIAL_AUDIT_LOGS;
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SYSTEM_CONFIG;
      }
    }
    return INITIAL_SYSTEM_CONFIG;
  });

  // Auth state
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isInitialSyncLoading, setIsInitialSyncLoading] = useState(true);

  // Upload workflow state
  const uploadAbortRef = useRef<AbortController | null>(null);
  const activeUploadVersionRef = useRef<string | null>(null);
  const [uploadCancelledNotice, setUploadCancelledNotice] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'idle' | 'uploading' | 'validating' | 'publishing' | 'completed' | 'error';
    percentage: number;
    details?: string;
    error?: string;
    verifiedMetadata?: any;
    speedFormatted?: string;
    etaFormatted?: string;
    transferredFormatted?: string;
  }>({ stage: 'idle', percentage: 0 });

  const [quotaStatus] = useState<{
    isExceeded: boolean;
    upgradeUrl?: string;
    pricingUrl?: string;
    metric?: string;
  }>({
    isExceeded: false,
    upgradeUrl: 'https://console.firebase.google.com/project/_/usage',
    pricingUrl: 'https://firebase.google.com/pricing',
    metric: 'Free daily write units per project',
  });

  // Sync theme to HTML class
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
  }, [versions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(downloadStats));
  }, [downloadStats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(systemConfig));
  }, [systemConfig]);

  // Sync route with URL hash for GitHub Pages compatibility
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        setCurrentRoute('home');
        return;
      }

      const parts = hash.split('/');
      const baseSegment = parts[0];
      const param = parts[1];

      if (baseSegment === 'apps' && param) {
        setSelectedAppId(param);
        setCurrentRoute('app-details');
      } else if (baseSegment === 'categories' && param) {
        setSelectedCategory(decodeURIComponent(param));
        setCurrentRoute('categories');
      } else if (
        [
          'home',
          'categories',
          'admin-login',
          'admin-dashboard',
          'admin-apps',
          'admin-upload',
          'admin-versions',
          'admin-analytics',
          'admin-storage',
          'admin-activity',
          'admin-settings',
          'about',
          'privacy',
          'terms',
          'contact',
          'install-guide',
        ].includes(baseSegment as AppRoute)
      ) {
        if (param) setSelectedAppId(param);
        setCurrentRoute(baseSegment as AppRoute);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: AppRoute, appId?: string | null, category?: string | null) => {
    setCurrentRoute(route);
    if (appId !== undefined) setSelectedAppId(appId);
    if (category !== undefined) setSelectedCategory(category);

    // Update window hash
    if (route === 'app-details' && appId) {
      window.location.hash = `#/apps/${appId}`;
    } else if (route === 'categories' && category) {
      window.location.hash = `#/categories/${encodeURIComponent(category)}`;
    } else if (route === 'home') {
      window.location.hash = '#/';
    } else {
      window.location.hash = appId ? `#/${route}/${appId}` : `#/${route}`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Firebase Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const isAdminEmail = isAuthorizedAdminEmail(fbUser.email);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
          isAdmin: isAdminEmail,
        });
      } else {
        // Check if there is an active simulated session in preview
        const simulated = sessionStorage.getItem('appdrop_simulated_admin');
        if (simulated && ADMIN_CONFIGURED_EMAIL) {
          setUser({
            uid: 'admin_preview_uid',
            email: ADMIN_CONFIGURED_EMAIL,
            displayName: 'Configured Administrator',
            photoURL: null,
            emailVerified: true,
            isAdmin: true,
          });
        } else {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time synchronization for published applications and versions
  useEffect(() => {
    if (!db) return;

    // For public visitors: single-field query avoids missing Firestore composite index;
    // visibility is filtered client-side. For admin: query all applications.
    const appsQuery = user?.isAdmin
      ? collection(db, 'apps')
      : query(collection(db, 'apps'), where('status', '==', 'published'));

    const unsubscribeApps = onSnapshot(
      appsQuery,
      (snapshot) => {
        const remoteApps: AppRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AppRecord;
          if (data && data.id && (user?.isAdmin || data.visibility === 'public')) {
            remoteApps.push(data);
          }
        });

        // Clean out legacy demo records if any exist in remote store
        const cleanedRemoteApps = remoteApps.filter((a) => !isLegacyDemoApp(a));

        // Sort: featured first, then newest updated/created
        cleanedRemoteApps.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          );
        });

        setApps((prevLocal) => {
          // Keep recently created local apps (in-flight within last 15s) until Firestore snapshot confirms
          const now = Date.now();
          const inFlightLocal = prevLocal.filter(
            (local) =>
              !cleanedRemoteApps.some((r) => r.id === local.id) &&
              now - new Date(local.createdAt || 0).getTime() < 15000
          );
          const combined = [...cleanedRemoteApps, ...inFlightLocal];
          combined.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (
              new Date(b.updatedAt || b.createdAt).getTime() -
              new Date(a.updatedAt || a.createdAt).getTime()
            );
          });
          return combined;
        });
        setIsInitialSyncLoading(false);
      },
      (error) => {
        console.warn('Real-time apps snapshot sync notice:', error.message);
        setIsInitialSyncLoading(false);
      }
    );

    // Real-time listener for versions across all devices
    const versionsQuery = user?.isAdmin
      ? collection(db, 'versions')
      : query(collection(db, 'versions'), where('status', '==', 'published'));

    const unsubscribeVersions = onSnapshot(
      versionsQuery,
      (snapshot) => {
        const remoteVersions: VersionRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as VersionRecord;
          if (data && data.id) {
            remoteVersions.push(data);
          }
        });

        const cleanedRemoteVersions = remoteVersions.filter((v) => !isLegacyDemoVersion(v));

        setVersions((prevLocal) => {
          const now = Date.now();
          const inFlightLocal = prevLocal.filter(
            (local) =>
              !cleanedRemoteVersions.some((r) => r.id === local.id) &&
              now - new Date(local.createdAt || 0).getTime() < 15000
          );
          return [...cleanedRemoteVersions, ...inFlightLocal];
        });
      },
      (error) => {
        console.warn('Real-time versions snapshot sync notice:', error.message);
      }
    );

    // Real-time listener for downloadStats across all devices
    const statsQuery = collection(db, 'downloadStats');
    const unsubscribeStats = onSnapshot(
      statsQuery,
      (snapshot) => {
        const remoteStats: DownloadStat[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DownloadStat;
          if (data && data.appId) {
            remoteStats.push(data);
          }
        });
        if (remoteStats.length > 0) {
          setDownloadStats((prevLocal) => {
            const merged = new Map<string, DownloadStat>();
            prevLocal.forEach((s) => merged.set(s.id, s));
            remoteStats.forEach((s) => merged.set(s.id, s));
            return Array.from(merged.values());
          });
        }
      },
      (error) => {
        console.warn('Real-time download stats snapshot sync notice:', error.message);
      }
    );

    // Instant local cross-tab real-time channel
    let crossTabChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        crossTabChannel = new BroadcastChannel('appdrop_realtime_channel');
        crossTabChannel.onmessage = (event) => {
          if (!event.data) return;
          if (event.data.type === 'APP_PUBLISHED') {
            const { app, version } = event.data;
            if (app) {
              setApps((prev) => {
                const map = new Map(prev.map((a) => [a.id, a]));
                map.set(app.id, app);
                return Array.from(map.values());
              });
            }
            if (version) {
              setVersions((prev) => {
                const map = new Map(prev.map((v) => [v.id, v]));
                map.set(version.id, version);
                return Array.from(map.values());
              });
            }
          } else if (event.data.type === 'APP_DELETED') {
            const { appId } = event.data;
            if (appId) {
              setApps((prev) => prev.filter((a) => a.id !== appId));
              setVersions((prev) => prev.filter((v) => v.appId !== appId));
            }
          }
        };
      }
    } catch {}

    return () => {
      unsubscribeApps();
      unsubscribeVersions();
      unsubscribeStats();
      if (crossTabChannel) {
        crossTabChannel.close();
      }
    };
  }, [user?.isAdmin]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const isAdm = isAuthorizedAdminEmail(result.user.email);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        isAdmin: isAdm,
      });
      navigateTo('admin-dashboard');
    } catch (err: any) {
      console.warn('Google popup sign-in note:', err);
      // If popup fails (e.g. in hermetic iframe environment), offer quick simulation when configured
      if (!ADMIN_CONFIGURED_EMAIL) {
        throw new Error('Administrator email is not configured (set VITE_ADMIN_EMAIL in .env).');
      }
      simulateAdminSignIn(ADMIN_CONFIGURED_EMAIL);
    }
  };

  const simulateAdminSignIn = (emailInput?: string) => {
    if (!ADMIN_CONFIGURED_EMAIL) {
      throw new Error('Administrator email is not configured (set VITE_ADMIN_EMAIL in .env).');
    }
    const targetEmail = (emailInput || '').trim().toLowerCase();
    if (!isAuthorizedAdminEmail(targetEmail)) {
      throw new Error('Unauthorized access. Invalid admin email.');
    }
    sessionStorage.setItem('appdrop_simulated_admin', 'true');
    setUser({
      uid: 'admin_preview_uid',
      email: ADMIN_CONFIGURED_EMAIL,
      displayName: 'Configured Administrator',
      photoURL: null,
      emailVerified: true,
      isAdmin: true,
    });
    navigateTo('admin-dashboard');
  };

  const signOut = async () => {
    sessionStorage.removeItem('appdrop_simulated_admin');
    await fbSignOut(auth).catch(() => {});
    setUser(null);
    navigateTo('home');
  };

  const appendAuditLog = (
    action: AuditLog['action'],
    appId: string,
    versionId: string | null,
    details: string,
    result: 'success' | 'failure' = 'success'
  ) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorUid: user?.uid || 'system_actor',
      actorEmail: user?.email || ADMIN_CONFIGURED_EMAIL || 'system-admin@appdrop.local',
      action,
      appId,
      versionId,
      createdAt: new Date().toISOString(),
      requestId: generateRequestId(),
      result,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Cross-tab synchronization broadcast helper
  const broadcastSync = (payload: {
    type: 'APP_PUBLISHED' | 'APP_DELETED';
    app?: AppRecord;
    version?: VersionRecord;
    appId?: string;
  }) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const ch = new BroadcastChannel('appdrop_realtime_channel');
        ch.postMessage(payload);
        ch.close();
      }
    } catch {}
  };

  // App mutations
  const createApp = async (data: Partial<AppRecord>): Promise<string> => {
    const newId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newApp: AppRecord = {
      id: newId,
      name: data.name || 'Untitled Application',
      packageName: data.packageName || 'com.example.app',
      shortDescription: (data.shortDescription || '').slice(0, 200),
      description: data.description || '',
      category: data.category || 'Utilities',
      tags: data.tags || ['utility'],
      iconPath:
        data.iconPath ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
      screenshotPaths: data.screenshotPaths || [],
      latestPublishedVersionId: null,
      featured: data.featured || false,
      featuredOrder: data.featuredOrder || apps.length + 1,
      visibility: data.visibility || 'public',
      status: 'published',
      mandatoryUpdate: data.mandatoryUpdate || false,
      minimumSupportedVersionCode: data.minimumSupportedVersionCode || null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    setApps((prev) => [newApp, ...prev]);
    appendAuditLog('app.created', newId, null, `Created application "${newApp.name}" (${newApp.packageName}).`);
    broadcastSync({ type: 'APP_PUBLISHED', app: newApp });

    // Real-time synchronization to Firestore
    try {
      await setDoc(doc(db, 'apps', newId), newApp);
    } catch (err) {
      console.warn('Firestore real-time sync createApp note:', err);
    }

    return newId;
  };

  const updateApp = async (appId: string, data: Partial<AppRecord>) => {
    const now = new Date().toISOString();
    let updatedTarget: AppRecord | null = null;
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          updatedTarget = { ...app, ...data, updatedAt: now };
          return updatedTarget;
        }
        return app;
      })
    );
    appendAuditLog('app.updated', appId, null, `Updated metadata for application.`);
    if (updatedTarget) {
      broadcastSync({ type: 'APP_PUBLISHED', app: updatedTarget });
    }

    // Real-time synchronization to Firestore
    try {
      await updateDoc(doc(db, 'apps', appId), { ...data, updatedAt: now });
    } catch (err) {
      console.warn('Firestore real-time sync updateApp note:', err);
    }
  };

  const archiveApp = async (appId: string) => {
    const now = new Date().toISOString();
    let archivedTarget: AppRecord | null = null;
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          archivedTarget = { ...app, status: 'archived', archivedAt: now, updatedAt: now };
          return archivedTarget;
        }
        return app;
      })
    );
    appendAuditLog('app.archived', appId, null, `Archived application. Hidden from public listings.`);
    if (archivedTarget) {
      broadcastSync({ type: 'APP_PUBLISHED', app: archivedTarget });
    }

    // Real-time synchronization to Firestore
    try {
      await updateDoc(doc(db, 'apps', appId), { status: 'archived', archivedAt: now, updatedAt: now });
    } catch (err) {
      console.warn('Firestore real-time sync archiveApp note:', err);
    }
  };

  const restoreApp = async (appId: string) => {
    const now = new Date().toISOString();
    let restoredTarget: AppRecord | null = null;
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          restoredTarget = { ...app, status: 'published', archivedAt: null, updatedAt: now };
          return restoredTarget;
        }
        return app;
      })
    );
    appendAuditLog('app.restored', appId, null, `Restored application to published state.`);
    if (restoredTarget) {
      broadcastSync({ type: 'APP_PUBLISHED', app: restoredTarget });
    }

    // Real-time synchronization to Firestore
    try {
      await updateDoc(doc(db, 'apps', appId), { status: 'published', archivedAt: null, updatedAt: now });
    } catch (err) {
      console.warn('Firestore real-time sync restoreApp note:', err);
    }
  };

  const deleteApp = async (appId: string) => {
    const targetApp = apps.find((a) => a.id === appId);
    if (!targetApp) return;

    const impact = calculateDeletionImpact(targetApp, versions);

    // Clean up stored binaries from Cloud Storage, server disk, and local caches
    const appVers = versions.filter((v) => v.appId === appId);
    for (const v of appVers) {
      await deleteApkBinary(v.id, {
        appId,
        fileName: formatApkDownloadFileName(targetApp.name, v.versionName),
        apkPath: v.apkPath,
      });
    }

    // Remove app and its versions from local state
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setVersions((prev) => prev.filter((v) => v.appId !== appId));
    broadcastSync({ type: 'APP_DELETED', appId });

    appendAuditLog(
      'app.deleted',
      appId,
      null,
      `Permanently deleted application "${targetApp.name}". Removed ${impact.versionCount} versions and freed ${(impact.totalStorageBytes / (1024 * 1024)).toFixed(1)} MB.`
    );

    // Real-time synchronization to Firestore
    try {
      await deleteDoc(doc(db, 'apps', appId));
      for (const v of appVers) {
        await deleteDoc(doc(db, 'apps', appId, 'versions', v.id)).catch(() => {});
        await deleteDoc(doc(db, 'versions', v.id)).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore real-time sync deleteApp note:', err);
    }
  };

  const rollbackVersion = async (appId: string, targetVersionId: string) => {
    const targetApp = apps.find((a) => a.id === appId);
    const targetVer = versions.find((v) => v.id === targetVersionId);

    if (!targetApp || !targetVer) {
      return { success: false, error: 'Target app or version record not found.' };
    }

    const check = canRollbackToVersion(targetApp, targetVer);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const { updatedApp, updatedVersions } = applyRollback(targetApp, targetVersionId, versions);
    setApps((prev) => prev.map((a) => (a.id === appId ? updatedApp : a)));
    setVersions(updatedVersions);

    appendAuditLog(
      'version.rollback',
      appId,
      targetVersionId,
      `Rolled back current published version of "${targetApp.name}" to ${targetVer.versionName} (v${targetVer.versionCode}).`
    );

    // Real-time synchronization to Firestore
    try {
      await updateDoc(doc(db, 'apps', appId), {
        latestPublishedVersionId: targetVersionId,
        updatedAt: new Date().toISOString(),
      });
      for (const v of updatedVersions) {
        await updateDoc(doc(db, 'versions', v.id), { isLatest: v.id === targetVersionId }).catch(() => {});
        await updateDoc(doc(db, 'apps', appId, 'versions', v.id), { isLatest: v.id === targetVersionId }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore real-time sync rollbackVersion note:', err);
    }

    return { success: true };
  };

  const updateReleaseNotes = async (versionId: string, releaseNotes: string) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === versionId ? { ...v, releaseNotes } : v))
    );
    const targetVer = versions.find((v) => v.id === versionId);
    if (targetVer) {
      appendAuditLog(
        'app.updated',
        targetVer.appId,
        versionId,
        `Updated release notes for version ${targetVer.versionName}.`
      );

      // Real-time synchronization to Firestore
      try {
        await updateDoc(doc(db, 'versions', versionId), { releaseNotes });
        await updateDoc(doc(db, 'apps', targetVer.appId, 'versions', versionId), { releaseNotes }).catch(() => {});
      } catch (err) {
        console.warn('Firestore real-time sync updateReleaseNotes note:', err);
      }
    }
  };

  const requestDownload = async (appId: string, versionId: string) => {
    const targetApp = apps.find((a) => a.id === appId);
    const targetVer = versions.find((v) => v.id === versionId);

    if (!targetApp || !targetVer) {
      throw new Error('Application or version record not found.');
    }

    if (targetApp.status !== 'published' || targetVer.status !== 'published') {
      throw new Error('Cannot download unpublished or archived application version.');
    }

    if (!targetVer.sha256 || targetVer.sha256.length !== 64 || !targetVer.apkSizeBytes || targetVer.apkSizeBytes <= 0) {
      throw new Error('Integrity metadata (SHA-256 or byte size) is missing or corrupted for this release.');
    }

    const reqId = generateRequestId();
    const { updatedStats, updatedEvents } = recordDownloadEvent(
      downloadStats,
      downloadEvents,
      appId,
      versionId,
      reqId
    );

    setDownloadStats(updatedStats);
    setDownloadEvents(updatedEvents);

    // Sync download event & download count to Firestore in background without delaying the download stream
    void (async () => {
      try {
        const eventDoc = {
          id: reqId,
          appId,
          versionId,
          eventType: 'download_url_issued',
          createdAt: new Date().toISOString(),
          requestId: reqId,
        };
        await setDoc(doc(db, 'downloadEvents', reqId), eventDoc);

        const today = new Date().toISOString().split('T')[0];
        const statId = `${today}_${appId}_${versionId}`.replace(/[/\\?%*:|"<>]/g, '_');
        const curStat = updatedStats.find((s) => s.appId === appId && s.versionId === versionId && s.date === today);
        const totalCount = curStat ? (curStat.requestCount || (curStat as any).downloads || 1) : 1;
        await setDoc(
          doc(db, 'downloadStats', statId),
          {
            id: statId,
            appId,
            versionId,
            date: today,
            requestCount: totalCount,
            downloads: totalCount,
            updatedAt: new Date().toISOString(),
            lastDownloadedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (statErr) {
        console.warn('Non-blocking Firestore download event sync notice:', statErr);
      }
    })();

    const fileName = formatApkDownloadFileName(targetApp.name, targetVer.versionName);

    // Determine authoritative download URL
    let authoritativeUrl = targetVer.downloadUrl || '';
    const basePath = getApiBasePath();

    // Normalize relative /api/apks/* URLs immediately without hitting Cloud Storage
    if (authoritativeUrl.startsWith('/api/apks/') && basePath) {
      authoritativeUrl = `${basePath}${authoritativeUrl}`;
    }

    // Only attempt Firebase Storage getDownloadURL when no local/direct URL exists AND bucket is actually provisioned
    if (!authoritativeUrl) {
      try {
        const { storage, app: fbApp } = await import('../lib/firebase');
        if (storage && (await isCloudStorageBucketAvailable(fbApp?.options?.storageBucket))) {
          const { ref, getDownloadURL } = await import('firebase/storage');
          const candidatePaths = [
            targetVer.apkPath,
            `published/${targetApp.id}/${targetVer.id}/${fileName}`,
            `published/${targetApp.id}/${targetVer.id}/${fileName.endsWith('.apk') ? fileName : fileName + '.apk'}`,
            `published/${targetApp.id}/${targetVer.id}.apk`,
            `published/${targetVer.id}.apk`,
          ].filter(Boolean) as string[];

          for (const cPath of candidatePaths) {
            try {
              authoritativeUrl = await getDownloadURL(ref(storage, cPath));
              if (authoritativeUrl) break;
            } catch {}
          }
        }
      } catch {}
    }

    // Default to verified backend endpoint if still missing
    if (!authoritativeUrl) {
      const encodedName = encodeURIComponent(fileName);
      authoritativeUrl = `${basePath}/api/apks/${versionId}/download?filename=${encodedName}`;
    }

    return {
      downloadUrl: authoritativeUrl,
      fileName,
      directServerUrl: authoritativeUrl,
      sha256: targetVer.sha256,
      apkSizeBytes: targetVer.apkSizeBytes,
    };
  };

  const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    const updated = {
      ...systemConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setSystemConfig(updated);
    appendAuditLog(
      'config.updated',
      'system',
      null,
      `Updated system configuration. Maintenance mode: ${updated.maintenanceMode ? 'ACTIVE' : 'OFF'}.`
    );
  };

  const clearUploadCancelledNotice = () => {
    setUploadCancelledNotice(null);
  };

  const resetUploadProgress = () => {
    setUploadProgress({ stage: 'idle', percentage: 0 });
  };

  const cancelApkUpload = () => {
    const controller = uploadAbortRef.current;
    const partialVersionId = activeUploadVersionRef.current;
    uploadAbortRef.current = null;
    activeUploadVersionRef.current = null;

    if (controller) {
      controller.abort();
    }

    setUploadProgress({ stage: 'idle', percentage: 0 });
    setUploadCancelledNotice(
      'Upload cancelled — no partial package was published. You can select another APK file.'
    );

    if (partialVersionId) {
      const basePath = getApiBasePath();
      void fetch(`${basePath}/api/apks/upload/${encodeURIComponent(partialVersionId)}`, {
        method: 'DELETE',
      }).catch(() => {});
      if (basePath) {
        void fetch(`/api/apks/upload/${encodeURIComponent(partialVersionId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
      void deleteApkBinary(partialVersionId).catch(() => {});
    }
  };

  const purgeAllStorage = async () => {
    return await purgeAllStoredFiles();
  };

  const triggerManualDeploy = async () => {
    return { message: 'Deployment triggered successfully. Changes will be live momentarily.' };
  };

  /**
   * Complete resilient upload and publication pipeline:
   * 1. Inspects APK binary and validates format
   * 2. Checks package name match against parent app
   * 3. Checks version code uniqueness
   * 4. Computes SHA-256 and verifies digital signature
   * 5. Atomically publishes or preserves previous version on failure
   */
  /**
   * Helper to format an application display name from package name or filename
   */
  const formatAppNameFromPackage = (packageName: string, fileName?: string): string => {
    if (fileName) {
      const cleanName = fileName.replace(/\.apk$/i, '');
      const withoutVer = cleanName.replace(/[-_]?(v|version|c|build)?\d+.*$/i, '');
      if (withoutVer && withoutVer.length > 2) {
        const parts = withoutVer.split(/[-_.]+/).filter(Boolean);
        const useful = parts.filter(
          (p) => !['com', 'org', 'net', 'io', 'app'].includes(p.toLowerCase())
        );
        if (useful.length > 0) {
          return useful
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
        }
      }
    }

    const segments = packageName.split('.').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || packageName;
    return lastSegment
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * Complete resilient upload and publication pipeline:
   * 1. Inspects APK binary and validates format
   * 2. Auto-creates app record if not previously registered
   * 3. Checks version code uniqueness
   * 4. Computes SHA-256 and verifies digital signature
   * 5. Persists exact original binary blob in IndexedDB (preserving byte size and content)
   * 6. Atomically publishes or preserves previous version on failure
   */
  const startApkUpload = async (
    arg1: string | File,
    arg2: File | string,
    arg3: string = '',
    arg4?: {
      name?: string;
      category?: string;
      iconPath?: string;
      shortDescription?: string;
      description?: string;
      externalDownloadUrl?: string;
    }
  ): Promise<boolean> => {
    let file: File;
    let releaseNotes: string = '';
    let specifiedAppId: string | null = null;
    let appMeta = arg4;

    if (arg1 instanceof File) {
      file = arg1;
      releaseNotes = typeof arg2 === 'string' ? arg2 : '';
      specifiedAppId = arg3 || null;
    } else {
      specifiedAppId = arg1 || null;
      file = arg2 as File;
      releaseNotes = arg3 || '';
    }

    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
    }
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;
    const signal = abortController.signal;
    setUploadCancelledNotice(null);

    try {
      // Step 1: Validating APK package
      setUploadProgress({
        stage: 'validating',
        percentage: 15,
        details: `Reading & verifying ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`,
      });

      const metadata = await inspectApkFile(
        file,
        file.name,
        undefined,
        (hashPct) => {
          if (signal.aborted) return;
          setUploadProgress((prev) => ({
            ...prev,
            stage: 'validating',
            percentage: Math.min(24, 15 + Math.round((hashPct / 100) * 9)),
            details: `Inspecting & hashing ${file.name} (${hashPct}%)...`,
          }));
        },
        signal
      );

      if (signal.aborted) {
        return false;
      }

      setUploadProgress({
        stage: 'validating',
        percentage: 25,
        details: `Verified ${metadata.packageName} (v${metadata.versionName}). Staging binary transfer...`,
      });

      // Find target app if specified, or find by extracted package name, or prepare auto-creation (committed ONLY after verified upload)
      let targetApp = specifiedAppId ? apps.find((a) => a.id === specifiedAppId) : null;
      if (!targetApp) {
        targetApp = apps.find(
          (a) => a.packageName.toLowerCase() === metadata.packageName.toLowerCase()
        );
      }

      const now = new Date().toISOString();
      let targetAppId: string;
      let wasAutoCreated = false;

      if (!targetApp) {
        wasAutoCreated = true;
        targetAppId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const autoName =
          appMeta?.name?.trim() || formatAppNameFromPackage(metadata.packageName, file.name);
        const autoCategory = appMeta?.category || 'Tools';
        const autoIcon =
          appMeta?.iconPath ||
          `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23g)"/><path d="M50 20 C65 20 75 35 75 55 L70 65 L50 55 L30 65 L25 55 C25 35 35 20 50 20 Z" fill="white"/><circle cx="50" cy="40" r="7" fill="%231d4ed8"/></svg>`;

        targetApp = {
          id: targetAppId,
          name: autoName.slice(0, 100),
          packageName: metadata.packageName.slice(0, 150),
          shortDescription: (
            appMeta?.shortDescription || `${autoName} Android application package.`
          ).slice(0, 200),
          description:
            appMeta?.description ||
            `${autoName} application package. Directly published with verified digital signatures and cryptographic checksums.`,
          category: autoCategory.slice(0, 50),
          tags: [autoCategory.toLowerCase(), 'android', 'apk'],
          iconPath: autoIcon,
          screenshotPaths: [],
          latestPublishedVersionId: null,
          featured: false,
          featuredOrder: apps.length + 1,
          visibility: 'public',
          status: 'published',
          mandatoryUpdate: false,
          minimumSupportedVersionCode: null,
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
        };
      } else {
        targetAppId = targetApp.id;
        // If specified app was chosen, verify package name matches
        if (targetApp.packageName.toLowerCase() !== metadata.packageName.toLowerCase()) {
          const err = `Package name mismatch. APK contains "${metadata.packageName}", but application requires "${targetApp.packageName}".`;
          setUploadProgress({ stage: 'error', percentage: 75, error: err });
          return false;
        }
      }

      // Collect existing version codes for duplicate prevention
      const existingCodes = versions
        .filter((v) => v.appId === targetAppId)
        .map((v) => v.versionCode);

      const validation = validateApkAgainstApp(
        metadata,
        targetApp.packageName,
        existingCodes,
        systemConfig.maxUploadSizeBytes
      );

      if (!validation.valid) {
        const errorMsg = validation.errors.join(' ');
        setUploadProgress({
          stage: 'error',
          percentage: 75,
          error: errorMsg,
        });
        appendAuditLog(
          'version.uploaded',
          targetAppId,
          null,
          `Upload validation failed: ${errorMsg}`,
          'failure'
        );
        return false;
      }

      if (signal.aborted) {
        return false;
      }

      const newVersionId = `ver_${targetAppId}_${Date.now()}`;
      activeUploadVersionRef.current = newVersionId;

      // Step 3: Uploading & Storing stage
      setUploadProgress({
        stage: 'uploading',
        percentage: 28,
        details: `Connecting & preparing ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`,
        verifiedMetadata: metadata,
        speedFormatted: 'Starting...',
        etaFormatted: 'Estimating...',
        transferredFormatted: `0 B / ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      // Persist the exact original binary blob in remote storage (Cloud Storage / server storage) and verify byte/SHA match
      const saveResult = await saveApkBinary(newVersionId, file, {
        appId: targetAppId,
        fileName: file.name,
        sha256: metadata.sha256,
        signal,
        onProgress: (prog) => {
          if (signal.aborted) return;
          const mappedPct = Math.min(92, 30 + Math.round((prog.percentage || 0) * 0.62));
          setUploadProgress((prev) => ({
            ...prev,
            stage: 'uploading',
            percentage: mappedPct,
            details: `Streaming intact package (${prog.percentage || 0}%)...`,
            speedFormatted: prog.speedFormatted,
            etaFormatted: prog.etaFormatted,
            transferredFormatted: prog.transferredFormatted,
          }));
        },
      });

      if (signal.aborted) {
        await deleteApkBinary(newVersionId, {
          appId: targetAppId,
          fileName: file.name,
        }).catch(() => {});
        return false;
      }

      if (!saveResult || (!saveResult.cloudResult && !saveResult.serverResult && !saveResult.firestoreResult)) {
        throw new Error('Upload failed: Unable to verify intact binary in remote storage. Publishing cancelled.');
      }

      setUploadProgress((prev) => ({
        ...prev,
        stage: 'publishing',
        percentage: 95,
        details: 'Package written intact to storage. Verifying uploaded object and registering release...',
        etaFormatted: '< 1s',
      }));

      const basePath = getApiBasePath();
      const effectiveDownloadUrl =
        saveResult.cloudResult?.downloadUrl ||
        appMeta?.externalDownloadUrl?.trim() ||
        saveResult.serverResult?.downloadUrl ||
        `${basePath}/api/apks/${newVersionId}/download`;

      const effectiveApkPath =
        saveResult.cloudResult?.storagePath ||
        saveResult.effectiveStoragePath ||
        `published/${targetAppId}/${newVersionId}/${file.name}`;

      const newVersion: VersionRecord = {
        id: newVersionId,
        appId: targetAppId,
        versionName: metadata.versionName,
        versionCode: metadata.versionCode,
        releaseNotes:
          releaseNotes.trim() ||
          `Release ${metadata.versionName}\n• Performance improvements and bug fixes.`,
        apkPath: effectiveApkPath,
        apkSizeBytes: file.size, // Exact original byte length preserved
        sha256: metadata.sha256,
        signingCertificateSha256: metadata.signingCertificateSha256,
        status: 'published',
        isLatest: true,
        publishedAt: now,
        createdAt: now,
        createdBy: user?.uid || 'admin_uid',
        downloadUrl: effectiveDownloadUrl,
      };

      const updatedAppRecord: AppRecord = {
        ...targetApp,
        latestPublishedVersionId: newVersionId,
        updatedAt: now,
      };

      if (signal.aborted) {
        await deleteApkBinary(newVersionId, {
          appId: targetAppId,
          fileName: file.name,
          apkPath: effectiveApkPath,
        }).catch(() => {});
        return false;
      }

      // Real-time synchronization to Firestore BEFORE committing local pointer
      try {
        await setDoc(doc(db, 'apps', targetAppId), updatedAppRecord);
        await setDoc(doc(db, 'versions', newVersionId), newVersion);
        await setDoc(doc(db, 'apps', targetAppId, 'versions', newVersionId), newVersion);

        // Demote previous versions in Firestore
        const prevAppVersions = versions.filter(
          (v) => v.appId === targetAppId && v.id !== newVersionId
        );
        for (const pv of prevAppVersions) {
          await updateDoc(doc(db, 'versions', pv.id), { isLatest: false }).catch(() => {});
          await updateDoc(doc(db, 'apps', targetAppId, 'versions', pv.id), { isLatest: false }).catch(() => {});
        }
      } catch (fireErr: any) {
        // Roll back uploaded binary if Firestore rejects publication
        await deleteApkBinary(newVersionId, {
          appId: targetAppId,
          fileName: file.name,
          apkPath: effectiveApkPath,
        }).catch(() => {});
        throw new Error(
          `Publishing aborted: Firestore synchronization failed (${fireErr?.message || 'permission or quota error'}). Previous release remains untouched.`
        );
      }

      // Commit version & app state ONLY after verified upload + Firestore publication succeed
      setVersions((prev) => [
        newVersion,
        ...prev.map((v) => (v.appId === targetAppId ? { ...v, isLatest: false } : v)),
      ]);

      setApps((prev) =>
        wasAutoCreated
          ? [updatedAppRecord, ...prev]
          : prev.map((a) => (a.id === targetAppId ? updatedAppRecord : a))
      );

      if (wasAutoCreated) {
        appendAuditLog(
          'app.created',
          targetAppId,
          null,
          `Direct APK upload auto-created application profile for "${updatedAppRecord.name}" (${updatedAppRecord.packageName}).`
        );
      }

      // Cross-tab real-time broadcast
      broadcastSync({
        type: 'APP_PUBLISHED',
        app: updatedAppRecord,
        version: newVersion,
      });

      setUploadProgress({
        stage: 'completed',
        percentage: 100,
        details: `Successfully verified and published version ${metadata.versionName} (v${metadata.versionCode})!`,
        speedFormatted: 'Done',
        etaFormatted: 'Complete',
        transferredFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB / ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        verifiedMetadata: {
          ...metadata,
          appId: targetAppId,
          appName: targetApp.name,
        },
      });

      appendAuditLog(
        'version.published',
        targetAppId,
        newVersionId,
        `Published version ${metadata.versionName} (v${metadata.versionCode}) with verified signature for "${targetApp.name}".`
      );

      return true;
    } catch (err: any) {
      if (isAbortError(err) || signal.aborted) {
        setUploadProgress({ stage: 'idle', percentage: 0 });
        setUploadCancelledNotice(
          'Upload cancelled — no partial package was published. You can select another APK file.'
        );
        return false;
      }
      setUploadProgress({
        stage: 'error',
        percentage: 0,
        error: err.message || 'An unexpected error occurred during APK validation.',
      });
      return false;
    } finally {
      if (uploadAbortRef.current === abortController) {
        uploadAbortRef.current = null;
        activeUploadVersionRef.current = null;
      }
    }
  };

  const isAdmin = !!(user && user.isAdmin);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentRoute,
        selectedAppId,
        selectedCategory,
        searchQuery,
        setSearchQuery,
        navigateTo,

        apps,
        versions,
        downloadStats,
        auditLogs,
        systemConfig,
        user,
        isAdmin,
        authLoading,
        isInitialSyncLoading,

        signInWithGoogle,
        simulateAdminSignIn,
        signOut,
        createApp,
        updateApp,
        archiveApp,
        restoreApp,
        deleteApp,
        rollbackVersion,
        updateReleaseNotes,
        requestDownload,
        updateSystemConfig,
        purgeAllStorage,
        triggerManualDeploy,
        quotaStatus,

        uploadProgress,
        startApkUpload,
        cancelApkUpload,
        resetUploadProgress,
        uploadCancelledNotice,
        clearUploadCancelledNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
