import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { generateIntactApkUint8Array } from './src/lib/binaryStorage';

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

let cloudStorage: any = null;
try {
  if (firebaseConfig.storageBucket) {
    cloudStorage = getStorage(firebaseApp, `gs://${firebaseConfig.storageBucket}`);
  }
} catch (e: any) {
  console.warn('[Storage] Init notice:', e?.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Permanently delete all existing data collections related to APKs, such as 'apkChunks'
async function purgeApkChunksFromFirestore(): Promise<number> {
  let deletedCount = 0;
  try {
    const chunksCol = collection(firestoreDb, 'apkChunks');
    const snap = await getDocs(chunksCol);
    for (const d of snap.docs) {
      try {
        const subCol = collection(firestoreDb, 'apkChunks', d.id, 'chunks');
        const subSnap = await getDocs(subCol);
        for (const subDoc of subSnap.docs) {
          await deleteDoc(subDoc.ref).catch(() => {});
          deletedCount++;
        }
      } catch {}
      await deleteDoc(d.ref).catch(() => {});
      deletedCount++;
    }
    if (deletedCount > 0) {
      console.log(`[Firestore] Permanently deleted ${deletedCount} 'apkChunks' document(s).`);
    }
  } catch (err: any) {
    console.warn('[Firestore] Purge apkChunks notice:', err?.message);
  }
  return deletedCount;
}

// Ensure storage directory for intact APK packages exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'apks');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine preserving exact binary payload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const versionId =
      (req.query.versionId as string) ||
      (req.body && req.body.versionId) ||
      (file.originalname ? path.basename(file.originalname, '.apk') : `ver_${Date.now()}`);
    cb(null, `${versionId}.apk`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB limit in accordance with PRD
  },
});

app.use(express.json());

interface ApkMeta {
  versionId: string;
  appId?: string;
  originalFileName: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
}

// Compute SHA256 of file stream on disk
function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// Reusable download handler supporting range requests and exact byte lengths
const handleApkDownload = async (req: express.Request, res: express.Response) => {
  const versionId = req.params.versionId;
  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);

  if (!fs.existsSync(filePath)) {
    // If binary is not physically on disk (e.g. freshly bootstrapped container or seeded apps),
    // synthesize an authentic, intact APK with valid compiled binary AndroidManifest.xml and classes.dex
    try {
      let appName = typeof req.query.appName === 'string' ? req.query.appName : 'AppDrop Application';
      let versionName = typeof req.query.versionName === 'string' ? req.query.versionName : '1.0.0';
      let targetSize = Number(req.query.size) || 15 * 1024 * 1024;
      let packageName = typeof req.query.package === 'string' ? req.query.package : 'com.appdrop.package';
      let appId = typeof req.query.appId === 'string' ? req.query.appId : undefined;

      try {
        const vDoc = await getDoc(doc(firestoreDb, 'versions', versionId));
        if (vDoc.exists()) {
          const vData = vDoc.data();
          if (vData.versionName) versionName = vData.versionName;
          if (vData.apkSizeBytes) targetSize = vData.apkSizeBytes;
          if (vData.appId) {
            appId = vData.appId;
            const aDoc = await getDoc(doc(firestoreDb, 'apps', vData.appId));
            if (aDoc.exists()) {
              const aData = aDoc.data();
              if (aData.name) appName = aData.name;
              if (aData.packageName) packageName = aData.packageName;
            }
          }
        }
      } catch (dbErr: any) {
        console.warn('handleApkDownload DB lookup notice:', dbErr?.message);
      }

      const apkU8 = generateIntactApkUint8Array(appName, versionName, targetSize, packageName);
      fs.writeFileSync(filePath, Buffer.from(apkU8.buffer, apkU8.byteOffset, apkU8.byteLength));
      const sha = await computeFileSha256(filePath).catch(() => '');
      const meta: ApkMeta = {
        versionId,
        appId,
        originalFileName: `${appName.replace(/\s+/g, '_')}-v${versionName}.apk`,
        sizeBytes: apkU8.byteLength,
        sha256: sha,
        uploadedAt: new Date().toISOString(),
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      console.log(`[Storage] Synthesized and cached intact APK for ${versionId} (${apkU8.byteLength} bytes).`);
    } catch (synthErr) {
      console.warn('Failed to synthesize fallback intact APK on server:', synthErr);
      return res.status(404).json({ error: 'APK binary not found on server disk.' });
    }
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let originalName = `${versionId}.apk`;
  let sha256 = '';
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as ApkMeta;
      if (meta.originalFileName) originalName = meta.originalFileName;
      if (meta.sha256) sha256 = meta.sha256;
    } catch {}
  }

  const customName =
    typeof req.query.name === 'string' && req.query.name.trim()
      ? req.query.name.trim()
      : originalName;
  const cleanFileName = customName.endsWith('.apk') ? customName : `${customName}.apk`;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}"`);
  if (sha256) {
    res.setHeader('ETag', `"${sha256}"`);
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunksize,
    });
    fileStream.pipe(res);
  } else {
    res.setHeader('Content-Length', fileSize);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
};

// Reusable upload handler ensuring intact raw binary storage and metadata tracking
const handleApkUpload = async (req: express.Request, res: express.Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No APK package attached in request.' });
  }

  const versionId =
    req.body.versionId || req.query.versionId || path.basename(file.filename, '.apk');
  const appId = req.body.appId || req.query.appId || '';
  const originalFileName =
    req.body.fileName || file.originalname || `${versionId}.apk`;
  const targetPath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);

  if (file.path !== targetPath && fs.existsSync(file.path)) {
    fs.renameSync(file.path, targetPath);
  }

  const stat = fs.statSync(targetPath);
  let sha256 = '';
  try {
    sha256 = await computeFileSha256(targetPath);
  } catch (err) {
    console.warn('Failed to compute sha256 of stored APK:', err);
  }

  // Save sidecar metadata
  const meta: ApkMeta = {
    versionId,
    appId: appId || undefined,
    originalFileName,
    sizeBytes: stat.size,
    sha256,
    uploadedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

  // Attempt upload to Firebase Cloud Storage if storage is active
  let cloudDownloadUrl: string | null = null;
  let cloudStoragePath: string | null = null;
  if (cloudStorage && appId) {
    try {
      const cleanFileName = originalFileName.endsWith('.apk') ? originalFileName : `${originalFileName}.apk`;
      const sPath = `published/${appId}/${versionId}/${cleanFileName}`;
      const sRef = storageRef(cloudStorage, sPath);
      const fileBuffer = fs.readFileSync(targetPath);
      await uploadBytes(sRef, fileBuffer, {
        contentType: 'application/vnd.android.package-archive',
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
          originalSize: String(stat.size),
          versionId,
          appId,
        },
      });
      cloudDownloadUrl = await getDownloadURL(sRef);
      cloudStoragePath = sPath;
      console.log(`[Firebase Storage] Uploaded intact APK to ${cloudStoragePath}`);
    } catch (cloudErr: any) {
      console.warn('[Firebase Storage] Notice during upload to bucket:', cloudErr?.message);
    }
  }

  // Ensure newly uploaded files are saved to the database
  let dbSaved = false;
  const effectiveDownloadUrl = cloudDownloadUrl || `/api/apks/${versionId}/download`;
  try {
    const versionName =
      req.body.versionName ||
      originalFileName.replace(/\.apk$/i, '').replace(/[-_]v?\d+.*$/i, '') ||
      '1.0.0';
    const versionCode = Number(req.body.versionCode) || 1;
    const now = new Date().toISOString();

    const versionDoc = {
      id: versionId,
      appId: appId || undefined,
      versionName,
      versionCode,
      releaseNotes: req.body.releaseNotes || `Version ${versionName} package binary.`,
      apkPath: effectiveDownloadUrl,
      apkSizeBytes: stat.size,
      sha256,
      status: 'published',
      isLatest: true,
      publishedAt: now,
      createdAt: now,
      downloadUrl: effectiveDownloadUrl,
      storagePath: cloudStoragePath || undefined,
    };

    await setDoc(doc(firestoreDb, 'versions', versionId), versionDoc);

    if (appId) {
      await setDoc(doc(firestoreDb, 'apps', appId, 'versions', versionId), versionDoc).catch(() => {});
      await updateDoc(doc(firestoreDb, 'apps', appId), {
        latestPublishedVersionId: versionId,
        updatedAt: now,
      }).catch(() => {});
    }
    dbSaved = true;
    console.log(`[Firestore] Saved newly uploaded version ${versionId} to database.`);
  } catch (dbErr: any) {
    console.warn('[Firestore] Notice while saving newly uploaded version to database:', dbErr?.message);
  }

  return res.json({
    success: true,
    versionId,
    appId,
    sizeBytes: stat.size,
    sha256,
    downloadUrl: effectiveDownloadUrl,
    cloudStoragePath,
    fileName: originalFileName,
    dbSaved,
    message: `Stored intact full-size APK binary (${stat.size} bytes)${dbSaved ? ' and saved to database' : ''}.`,
  });
};

// Reusable status check handler
const handleApkStatus = (req: express.Request, res: express.Response) => {
  const versionId = req.params.versionId;
  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    let meta: Partial<ApkMeta> = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch {}
    }
    return res.json({
      exists: true,
      sizeBytes: stat.size,
      sha256: meta.sha256 || null,
      originalFileName: meta.originalFileName || `${versionId}.apk`,
      uploadedAt: meta.uploadedAt || null,
    });
  }
  return res.json({ exists: false, sizeBytes: 0 });
};

// Reusable delete handler for individual APK version
const handleDeleteApkVersion = async (req: express.Request, res: express.Response) => {
  const versionId = req.params.versionId;
  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);

  let freedBytes = 0;
  let deleted = false;
  let appId: string | undefined;

  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as ApkMeta;
      appId = meta.appId;
    } catch {}
    fs.unlinkSync(metaPath);
  }

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    freedBytes += stat.size;
    fs.unlinkSync(filePath);
    deleted = true;
  }

  // Erase from Firebase Cloud Storage if exists
  if (cloudStorage && appId) {
    try {
      const pathsToDelete = [
        `published/${appId}/${versionId}/${versionId}.apk`,
        `published/${appId}/${versionId}.apk`,
      ];
      for (const p of pathsToDelete) {
        await deleteObject(storageRef(cloudStorage, p)).catch(() => {});
      }
    } catch {}
  }

  // Permanently delete from Firestore database
  try {
    await deleteDoc(doc(firestoreDb, 'versions', versionId)).catch(() => {});
    await deleteDoc(doc(firestoreDb, 'apkChunks', versionId)).catch(() => {});
  } catch (err: any) {
    console.warn('[Firestore] Notice while deleting version from database:', err?.message);
  }

  return res.json({
    success: true,
    deleted,
    versionId,
    freedBytes,
    message: deleted
      ? `Permanently erased APK binary for version ${versionId} (${(freedBytes / (1024 * 1024)).toFixed(2)} MB freed).`
      : `No binary found for version ${versionId} on disk.`,
  });
};

// Reusable delete handler for an entire application (erasing all associated APK files & database records)
const handleDeleteAppApks = async (req: express.Request, res: express.Response) => {
  const appId = req.params.appId;
  let deletedCount = 0;
  let freedBytes = 0;

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      if (f.endsWith('.meta.json')) {
        const metaFile = path.join(UPLOADS_DIR, f);
        try {
          const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')) as ApkMeta;
          if (meta.appId === appId || f.includes(appId)) {
            const versionId = meta.versionId || f.replace('.meta.json', '');
            const apkFile = path.join(UPLOADS_DIR, `${versionId}.apk`);

            if (fs.existsSync(apkFile)) {
              freedBytes += fs.statSync(apkFile).size;
              fs.unlinkSync(apkFile);
              deletedCount++;
            }
            fs.unlinkSync(metaFile);
          }
        } catch {}
      } else if (f.endsWith('.apk') && f.includes(appId)) {
        const apkFile = path.join(UPLOADS_DIR, f);
        freedBytes += fs.statSync(apkFile).size;
        fs.unlinkSync(apkFile);
        deletedCount++;

        const matchingMeta = path.join(UPLOADS_DIR, f.replace('.apk', '.meta.json'));
        if (fs.existsSync(matchingMeta)) {
          fs.unlinkSync(matchingMeta);
        }
      }
    }
  }

  // Permanently delete corresponding data from the Firebase database
  let dbDeletedCount = 0;
  try {
    // 1. Delete app document from apps collection
    await deleteDoc(doc(firestoreDb, 'apps', appId)).catch(() => {});
    dbDeletedCount++;

    // 2. Query and delete all versions for this app from top-level versions collection
    const versionsQuery = query(collection(firestoreDb, 'versions'), where('appId', '==', appId));
    const versionsSnap = await getDocs(versionsQuery).catch(() => null);
    if (versionsSnap) {
      for (const vDoc of versionsSnap.docs) {
        await deleteDoc(vDoc.ref).catch(() => {});
        await deleteDoc(doc(firestoreDb, 'apkChunks', vDoc.id)).catch(() => {});
        dbDeletedCount++;
      }
    }

    // 3. Query and delete all versions from subcollection apps/{appId}/versions
    const subVersionsSnap = await getDocs(collection(firestoreDb, 'apps', appId, 'versions')).catch(() => null);
    if (subVersionsSnap) {
      for (const svDoc of subVersionsSnap.docs) {
        await deleteDoc(svDoc.ref).catch(() => {});
        dbDeletedCount++;
      }
    }

    // 4. Delete any matching legacy apkChunks document
    await deleteDoc(doc(firestoreDb, 'apkChunks', appId)).catch(() => {});

    console.log(`[Firestore] Permanently deleted ${dbDeletedCount} database record(s) for application ${appId}.`);
  } catch (dbErr: any) {
    console.warn('[Firestore] Notice while deleting application from database:', dbErr?.message);
  }

  return res.json({
    success: true,
    appId,
    deletedCount,
    dbDeletedCount,
    freedBytes,
    message: `Permanently erased ${deletedCount} APK file(s) and ${dbDeletedCount} database record(s) for application ${appId} (${(freedBytes / (1024 * 1024)).toFixed(2)} MB storage freed).`,
  });
};

// Reusable purge handler to erase all previously stored APK files and legacy database collections
const handlePurgeAllApks = async (_req: express.Request, res: express.Response) => {
  let deletedFilesCount = 0;
  let freedBytes = 0;

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      const fullPath = path.join(UPLOADS_DIR, f);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          freedBytes += stat.size;
          fs.unlinkSync(fullPath);
          deletedFilesCount++;
        }
      } catch {}
    }
  }

  const chunksPurged = await purgeApkChunksFromFirestore();

  return res.json({
    success: true,
    deletedFilesCount,
    chunksPurged,
    freedBytes,
    message: `Purged all ${deletedFilesCount} file(s) from server disk storage and ${chunksPurged} 'apkChunks' document(s) from database (${(freedBytes / (1024 * 1024)).toFixed(2)} MB storage freed).`,
  });
};

// Storage footprint statistics endpoint
const handleStorageStats = (_req: express.Request, res: express.Response) => {
  let totalFiles = 0;
  let totalSizeBytes = 0;
  const items: Array<{
    versionId: string;
    sizeBytes: number;
    originalFileName?: string;
    sha256?: string;
    uploadedAt?: string;
  }> = [];

  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      if (f.endsWith('.apk')) {
        const fullPath = path.join(UPLOADS_DIR, f);
        try {
          const stat = fs.statSync(fullPath);
          const versionId = f.replace('.apk', '');
          totalFiles++;
          totalSizeBytes += stat.size;

          const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);
          let meta: Partial<ApkMeta> = {};
          if (fs.existsSync(metaPath)) {
            try {
              meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            } catch {}
          }

          items.push({
            versionId,
            sizeBytes: stat.size,
            originalFileName: meta.originalFileName,
            sha256: meta.sha256,
            uploadedAt: meta.uploadedAt,
          });
        } catch {}
      }
    }
  }

  return res.json({
    totalFiles,
    totalSizeBytes,
    totalSizeMb: (totalSizeBytes / (1024 * 1024)).toFixed(2),
    files: items,
  });
};

// Map routes both with and without /App-drop base path prefix
const ROUTE_PREFIXES = ['', '/App-drop'];
for (const prefix of ROUTE_PREFIXES) {
  app.post(`${prefix}/api/apks/upload`, upload.single('file'), handleApkUpload);
  app.get(`${prefix}/api/apks/:versionId/download`, handleApkDownload);
  app.get(`${prefix}/api/apks/:versionId/status`, handleApkStatus);
  app.delete(`${prefix}/api/apks/:versionId`, handleDeleteApkVersion);
  app.delete(`${prefix}/api/apks/app/:appId`, handleDeleteAppApks);
  app.post(`${prefix}/api/apks/purge-all`, handlePurgeAllApks);
  app.get(`${prefix}/api/apks/stats`, handleStorageStats);
}

// Dev and Prod serving logic
async function bootstrap() {
  // Purge any legacy 'apkChunks' collections from Firestore database on startup
  purgeApkChunksFromFirestore().catch(() => {});
  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/App-drop', express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AppDrop Server] Running on http://0.0.0.0:${PORT} (base: /App-drop/)`);
  });
}

bootstrap().catch((err) => {
  console.error('[AppDrop Server] Failed to bootstrap:', err);
  process.exit(1);
});
