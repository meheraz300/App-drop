import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

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
    const versionId = req.body.versionId || req.query.versionId || `ver_${Date.now()}`;
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

// Reusable download handler supporting range requests and exact byte lengths
const handleApkDownload = (req: express.Request, res: express.Response) => {
  const versionId = req.params.versionId;
  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'APK binary not found on server disk.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const customName = typeof req.query.name === 'string' && req.query.name.trim() ? req.query.name.trim() : `${versionId}.apk`;
  const cleanFileName = customName.endsWith('.apk') ? customName : `${customName}.apk`;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}"`);

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

// Reusable upload handler
const handleApkUpload = (req: express.Request, res: express.Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No APK package attached in request.' });
  }

  const versionId = req.body.versionId || req.query.versionId || path.basename(file.filename, '.apk');
  const targetPath = path.join(UPLOADS_DIR, `${versionId}.apk`);

  if (file.path !== targetPath && fs.existsSync(file.path)) {
    fs.renameSync(file.path, targetPath);
  }

  const stat = fs.statSync(targetPath);
  return res.json({
    success: true,
    versionId,
    sizeBytes: stat.size,
    downloadUrl: `/api/apks/${versionId}/download`,
    message: `Stored intact APK binary (${stat.size} bytes).`,
  });
};

// Reusable status check handler
const handleApkStatus = (req: express.Request, res: express.Response) => {
  const versionId = req.params.versionId;
  const filePath = path.join(UPLOADS_DIR, `${versionId}.apk`);

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    return res.json({ exists: true, sizeBytes: stat.size });
  }
  return res.json({ exists: false, sizeBytes: 0 });
};

// Map routes both with and without /App-drop base path prefix
const ROUTE_PREFIXES = ['', '/App-drop'];
for (const prefix of ROUTE_PREFIXES) {
  app.post(`${prefix}/api/apks/upload`, upload.single('file'), handleApkUpload);
  app.get(`${prefix}/api/apks/:versionId/download`, handleApkDownload);
  app.get(`${prefix}/api/apks/:versionId/status`, handleApkStatus);
}

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AppDrop Server] Running on http://0.0.0.0:${PORT} (base: /App-drop/)`);
  });
}

bootstrap().catch((err) => {
  console.error('[AppDrop Server] Failed to bootstrap:', err);
  process.exit(1);
});
