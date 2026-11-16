# AppDrop — Android Application Distribution Platform

AppDrop is a Google Play-inspired distribution hub for Android applications and APK versions. It provides public discovery and verified binary downloads for visitors without requiring user accounts, paired with a protected Admin Panel for Android app management, automated APK validation, and cryptographic signature auditing.

---

## 1. Core Architecture & Features

- **Public Hub**: Responsive, mobile-first Google Play-inspired interface with search, categories, and direct APK download URLs.
- **Admin Authentication**: Firebase Authentication with Google Sign-in restricted to the configured administrator identity (`mh3620305@gmail.com`).
- **Automated APK Validation Pipeline**:
  - Validates ZIP archive headers (`0x04034b50`).
  - Verifies Android reverse-DNS package name match against target app.
  - Enforces version code bounds and duplicate version code prevention.
  - Computes 64-character SHA-256 cryptographic digest.
  - Validates APK Signature Scheme v2/v3 digital signing block and certificate fingerprints.
- **Version Management & Atomic Rollback**: Historical versions remain preserved; rollback switches the current published pointer atomically with full audit logging.
- **Download Analytics**: Tracks daily download requests, per-app breakdown, and per-version request counts with idempotency keys.
- **Storage & Quota Management**: Configurable maximum APK upload size (default 500 MB).
- **Public Maintenance Mode**: Toggleable platform announcement banner while retaining administrative recovery access.

---

## 2. Project File Structure

```
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD to GitHub Pages
├── firebase-blueprint.json        # Intermediate Representation schema
├── firestore.rules                # Hardened Firestore ABAC Security Rules
├── storage.rules                  # Hardened Cloud Storage Security Rules
├── security_spec.md               # Threat model & Dirty Dozen attack payloads
├── src/
│   ├── types/index.ts             # Domain TypeScript interfaces
│   ├── lib/
│   │   ├── apkValidator.ts        # Pure logic APK binary inspection & rules
│   │   ├── apkValidator.test.ts   # Unit tests for APK validator (node:test)
│   │   ├── versionPolicy.ts       # Version state machine & rollback logic
│   │   ├── versionPolicy.test.ts  # Unit tests for version policy
│   │   ├── analyticsTracker.ts    # Download counter & daily aggregations
│   │   ├── analyticsTracker.test.ts # Unit tests for analytics
│   │   ├── firebase.ts            # Firebase SDK & standard error handlers
│   │   └── seedData.ts            # Realistic initial Android application data
│   ├── context/AppContext.tsx     # Global application state & mutations
│   ├── components/
│   │   ├── layout/                # Navbar (Top Bar Contract) & Footer
│   │   ├── public/                # HomeView, AppCard, AppDetailsView, StaticPages
│   │   └── admin/                 # Dashboard, AppManager, ApkUploader, VersionManager...
│   ├── App.tsx                    # Top-level routing
│   └── main.tsx                   # Entry point
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` for local development:

```env
# Configured Platform Administrator Email
VITE_ADMIN_EMAIL="mh3620305@gmail.com"

# Maximum APK upload size in bytes (default 500 MB)
VITE_MAX_APK_SIZE_BYTES=524288000
```

---

## 4. Running Tests & Compilation

Run the decoupled unit tests using Node.js's native test runner via `tsx`:

```bash
npm test
```

Build the static distribution for GitHub Pages:

```bash
npm run build
```

---

## 5. GitHub Pages Deployment

The repository includes a verified GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Pushes to `main` automatically run unit tests and bundle the static frontend to `./dist`.
2. The workflow utilizes GitHub Pages Actions (`actions/deploy-pages@v4`) with the SPA router hash routing strategy to guarantee that all direct links (`#/apps/:id`, `#/categories/:cat`, `#/admin`) load cleanly without 404s.
