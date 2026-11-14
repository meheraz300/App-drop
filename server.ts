import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';

const app = express();

// Parse CLI arguments passed by the dev runner (e.g., --port 3000 --host 0.0.0.0)
const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const cliPort = portIdx !== -1 && args[portIdx + 1] ? Number(args[portIdx + 1]) : null;
const envPort = process.env.PORT ? Number(process.env.PORT) : null;

// In AI Studio / Cloud Run containers, PORT 8080 is reserved for the Nginx reverse-proxy.
// Dev server must always bind to 3000 unless explicitly given a valid CLI port argument.
const PORT = cliPort || (envPort && envPort !== 8080 ? envPort : 3000);

const hostIdx = args.indexOf('--host');
const HOST = hostIdx !== -1 && args[hostIdx + 1] ? args[hostIdx + 1] : '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';

// Ensure storage directory for intact APK packages exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'apks');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function sanitizeVersionId(raw: unknown): string {
  const str = typeof raw === 'string' ? raw : '';
  return str.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

function computeFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Multer storage engine preserving exact binary payload under a temporary unique name
// until upload finishes and versionId/checksum verification passes.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, _file, cb) => {
    const tmpName = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.apk.part`;
    cb(null, tmpName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB limit in accordance with PRD
  },
});

// Reusable download handler supporting range requests and exact byte lengths
const handleApkDownload = (req: express.Request, res: express.Response) => {
  const versionId = sanitizeVersionId(req.params.versionId);
  if (!versionId) {
    return res.status(400).json({ error: 'Invalid version ID.' });
  }

  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const rawFileName = (req.query.filename as string) || (req.query.name as string) || `${versionId}.apk`;
  const cleanFileName = rawFileName.replace(/[/\\?%*:|"<>]/g, '').trim() || `${versionId}.apk`;
  const finalFileName = cleanFileName.endsWith('.apk') ? cleanFileName : `${cleanFileName}.apk`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'APK binary not found on server disk. Exact original package must be uploaded by the administrator.',
    });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${finalFileName}"; filename*=UTF-8''${encodeURIComponent(finalFileName)}`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileSize) {
      return res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
    }
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

// Reusable upload handler with byte-size and SHA-256 verification
const handleApkUpload = async (req: express.Request, res: express.Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No APK package attached in request.' });
  }

  const versionId =
    sanitizeVersionId(req.body?.versionId) ||
    sanitizeVersionId(req.query.versionId) ||
    `ver_${Date.now()}`;

  const expectedSizeRaw = req.body?.expectedSize || req.query.expectedSize;
  const expectedSize = expectedSizeRaw ? Number(expectedSizeRaw) : 0;
  const expectedSha256 = String(
    req.body?.expectedSha256 || req.query.expectedSha256 || ''
  )
    .trim()
    .toLowerCase();

  const targetPath = path.join(UPLOADS_DIR, `${versionId}.apk`);

  try {
    if (file.path !== targetPath && fs.existsSync(file.path)) {
      fs.renameSync(file.path, targetPath);
    }

    const stat = fs.statSync(targetPath);

    // Enforce exact byte-size check before accepting upload
    if (expectedSize > 0 && stat.size !== expectedSize) {
      fs.unlinkSync(targetPath);
      return res.status(400).json({
        error: `Upload truncated or size mismatch: expected ${expectedSize} bytes, received ${stat.size} bytes.`,
      });
    }

    const sha256 = await computeFileSha256(targetPath);

    // Enforce exact SHA-256 check if supplied by client
    if (expectedSha256 && expectedSha256.length === 64 && sha256 !== expectedSha256) {
      fs.unlinkSync(targetPath);
      return res.status(400).json({
        error: `Upload checksum mismatch: expected ${expectedSha256}, stored ${sha256}.`,
      });
    }

    const appId = String(req.body?.appId || req.query.appId || '');
    const fileName = String(
      req.body?.fileName || req.query.fileName || file.originalname || `${versionId}.apk`
    );

    try {
      const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);
      fs.writeFileSync(
        metaPath,
        JSON.stringify(
          {
            versionId,
            appId,
            originalFileName: fileName,
            sizeBytes: stat.size,
            sha256,
            uploadedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } catch {}

    const basePath = req.originalUrl.startsWith('/App-drop') ? '/App-drop' : '';
    return res.json({
      success: true,
      versionId,
      sizeBytes: stat.size,
      sha256,
      downloadUrl: `${basePath}/api/apks/${versionId}/download`,
      message: `Stored & verified intact APK binary (${stat.size} bytes, SHA-256 ${sha256.slice(0, 12)}...).`,
    });
  } catch (err: any) {
    try {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch {}
    return res.status(500).json({ error: err?.message || 'Failed to persist uploaded APK binary.' });
  }
};

// Reusable status check handler
const handleApkStatus = (req: express.Request, res: express.Response) => {
  const versionId = sanitizeVersionId(req.params.versionId);
  if (!versionId) {
    return res.status(400).json({ exists: false, sizeBytes: 0, error: 'Invalid version ID.' });
  }

  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    let sha256: string | undefined;
    try {
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        sha256 = meta.sha256;
      }
    } catch {}
    return res.json({ exists: true, sizeBytes: stat.size, sha256 });
  }
  return res.json({ exists: false, sizeBytes: 0 });
};

// Delete single APK version from server disk
const handleApkDelete = (req: express.Request, res: express.Response) => {
  const versionId = sanitizeVersionId(req.params.versionId);
  if (!versionId) {
    return res.status(400).json({ error: 'Invalid version ID.' });
  }

  const apkPath = path.join(UPLOADS_DIR, `${versionId}.apk`);
  const metaPath = path.join(UPLOADS_DIR, `${versionId}.meta.json`);
  let freedBytes = 0;
  let deleted = false;

  try {
    if (fs.existsSync(apkPath)) {
      freedBytes += fs.statSync(apkPath).size;
      fs.unlinkSync(apkPath);
      deleted = true;
    }
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete APK from disk.' });
  }

  return res.json({ success: true, deleted, freedBytes });
};

// Compute live disk storage statistics
const handleApkStats = (_req: express.Request, res: express.Response) => {
  try {
    const entries = fs.readdirSync(UPLOADS_DIR);
    let totalFiles = 0;
    let totalSizeBytes = 0;

    for (const entry of entries) {
      if (entry.endsWith('.apk')) {
        const fullPath = path.join(UPLOADS_DIR, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            totalFiles++;
            totalSizeBytes += stat.size;
          }
        } catch {}
      }
    }

    return res.json({
      totalFiles,
      totalSizeBytes,
      totalSizeMb: (totalSizeBytes / (1024 * 1024)).toFixed(1),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to compute storage statistics.' });
  }
};

// Purge all stored APKs from disk
const handleApkPurgeAll = (_req: express.Request, res: express.Response) => {
  try {
    const entries = fs.readdirSync(UPLOADS_DIR);
    let deletedFilesCount = 0;
    let freedBytes = 0;

    for (const entry of entries) {
      const fullPath = path.join(UPLOADS_DIR, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          if (entry.endsWith('.apk')) {
            deletedFilesCount++;
            freedBytes += stat.size;
          }
          fs.unlinkSync(fullPath);
        }
      } catch {}
    }

    return res.json({
      success: true,
      deletedCount: deletedFilesCount,
      deletedFilesCount,
      freedBytes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to purge disk storage.' });
  }
};

// Map routes both with and without /App-drop base path prefix
const ROUTE_PREFIXES = ['', '/App-drop'];
for (const prefix of ROUTE_PREFIXES) {
  app.get(`${prefix}/api/apks/stats`, handleApkStats);
  app.post(`${prefix}/api/apks/purge`, handleApkPurgeAll);
  app.post(`${prefix}/api/apks/purge-all`, handleApkPurgeAll);
  app.post(`${prefix}/api/apks/upload`, upload.single('file'), handleApkUpload);
  app.get(`${prefix}/api/apks/:versionId/download`, handleApkDownload);
  app.get(`${prefix}/api/apks/:versionId/status`, handleApkStatus);
  app.delete(`${prefix}/api/apks/:versionId`, handleApkDelete);
  app.post(`${prefix}/api/pipeline/trigger`, (_req, res) => {
    res.json({ ok: true, message: 'Pipeline acknowledged.' });
  });
}

// Guard: Never let unknown API requests fall through to HTML SPA fallback
app.use(['/api', '/App-drop/api'], (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Dev and Prod serving logic
async function bootstrap() {
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

  const server = app.listen(PORT, HOST, () => {
    console.log(`[AppDrop Server] Running on http://${HOST}:${PORT} (base: /App-drop/)`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[AppDrop Server] Port ${PORT} already in use. Retrying on port 3000...`);
      if (PORT !== 3000) {
        app.listen(3000, HOST, () => {
          console.log(`[AppDrop Server] Running on fallback http://${HOST}:3000 (base: /App-drop/)`);
        });
      }
    } else {
      console.error('[AppDrop Server] Server socket error:', err);
    }
  });
}

// Process resilience guards to prevent premature termination during pre-warming
process.on('uncaughtException', (err) => {
  console.error('[AppDrop Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[AppDrop Server] Unhandled rejection at:', promise, 'reason:', reason);
});

bootstrap().catch((err) => {
  console.error('[AppDrop Server] Failed to bootstrap:', err);
  process.exit(1);
});
