# BOOKSWIPE: LIQUID GLASS THEME, MASTER PROMPT

Paste everything below into Google AI Studio (or any coding AI), together with the reference screenshots.

---

## 0. ROLE AND NON-NEGOTIABLE RULES

You are a senior mobile UI engineer and designer. Apply a complete "Liquid Glass" theme to the EXISTING BookSwipe app. Do not create a new demo app.

1. Work inside the existing project. Read the whole repo first (Gradle files, theme files, every screen) and list what you found before changing anything.
2. Do NOT remove or break any working feature (auth, Firestore listings, chat, filters, admin).
3. Use ONLY the values in this document. Where a value is missing, STOP and list it under "Missing values" instead of guessing.
4. Do NOT invent screens, colors, fonts or features.
5. Put every number below into ONE central theme file (tokens). No hard-coded colors, sizes or radii inside screens.
6. Never write "PASS" for something you did not run. Use PASS / FAIL / BLOCKED, with a reason.
7. "It compiles" is not proof that it looks right. State clearly what you could not check visually.

## 1. PLATFORM

- Target: Android, Kotlin, Jetpack Compose, Material 3 (matches the existing repo). If the repo is something else, say so and stop.
- iOS is out of scope for this prompt. (A SwiftUI token file exists separately: accent, tint 0.40, shadow 0.21.)
- Backdrop blur is NOT built into Compose. Use the Haze library (check its current API), or RenderEffect on a copy of the background (Android 12 / API 31+).
- Fallback for API 30 and below, or when blur is off: NO blur, glass fill raised to 72% opacity so text stays readable.

## 2. PROVENANCE OF THE NUMBERS (read this first)

| Mark | Meaning |
|---|---|
| [YOURS] | Exported from your own Liquid Glass Lab settings |
| [LAB] | Default from the lab, not changed by you |
| [REC] | My recommendation from the 6-principles lab. Change if you disagree |

## 3. DESIGN TOKENS

### 3.1 Color: light mode
| Token | Value |
|---|---|
| primary | #4F5BD5 [YOURS] |
| primaryEnd (gradient end) | #7B63E0 [YOURS] |
| onPrimary | #FFFFFF |
| ink (main text) | #14205C [LAB] |
| inkMuted | #3B4775 [LAB] |
| glassBase (RGB) | 255, 255, 255 [LAB] |
| shadowColor | #1E2864 [LAB] |
| success text / bg | #0B6B4D / #D2F3E6 |
| used text / bg | #434B72 / #E4E7F3 |
| likeNew text / bg | #0B5C73 / #CDEFF8 |
| error | #B3261E, badge red #E5352B |

Backdrop (static soft gradient behind all screens, never animated): base linear 160deg #DDE6FF to #EFE7FF, plus three soft radial blobs: #7B8CFF (top-left 18% 12%), #C79BFF (right 88% 28%), #6EC8FF (bottom-left 28% 88%). Each blob fades to transparent by 42 to 44% radius [LAB].

### 3.2 Color: dark mode
| Token | Value |
|---|---|
| primary | #A4AEFF |
| primaryEnd | #B79CFF |
| onPrimary | #0E1230 |
| ink / inkMuted | #F2F5FF / #C3CCEA |
| glassBase (RGB) | 60, 70, 120 |
| shadowColor | #000000 |
| error | #F2B8B5 |

Backdrop: base 160deg #141A33 to #1E1838, same blobs. Dark mode scales glass tint by 0.55 and highlight by 0.70.

### 3.3 Glass recipe (one reusable `GlassSurface` composable)
| Parameter | Value |
|---|---|
| Fill | 135deg linear gradient, glassBase at tint alpha to glassBase at tint x 0.45 |
| tint (fill alpha) | 0.40 [YOURS] |
| Border | 1dp, white at 0.42 (highlight 0.60 x 0.7) |
| Top inner highlight | 1.5dp line at top edge, white at 0.60 [LAB] |
| Specular overlay | radial white at 0.33 (highlight 0.60 x 0.55), centered 20% / -10%, fades out by 55% |
| Shadow opacity | 0.21 [YOURS] |
| Shadow radius / offset | 8dp / x 0, y 8dp [YOURS] |
| Selected tint (chips, active tab) | primary at 0.40 alpha [YOURS] |

Blur levels (explicit):
- Cards and list rows: **0dp**. Never blur list items [REC: high performance cost].
- Nav bar, bottom sheets, top bar over scrolling content: **18dp** [REC]. NOTE: your lab export implies the blur slider was at 0 (shadow radius 8 only happens at blur 0). If you want no frosted look at all, set this to 0dp. One constant: `GLASS_BAR_BLUR_DP`.
- Saturation boost under blur: 1.6x [LAB].

### 3.4 Shape
| Element | Radius |
|---|---|
| Card, list row, hero | 28dp |
| Bottom sheet | 32dp (top corners only) |
| Search bar, buttons, chips, nav | full capsule (999dp) |
| Text field | 20dp |
| Book cover | 18dp (list cover: 6dp left, 14dp right, to look like a spine) |

### 3.5 Spacing and sizes (4dp grid)
- Screen horizontal padding 18dp. Gap between cards 14dp. Section gap 18dp.
- Minimum touch target 48dp everywhere.
- Search bar height 56dp. Chip height 44dp. Primary button height 56dp. Icon button 48dp.
- Nav bar: 14dp from screen sides, 14dp from bottom (plus system inset), height about 72dp, 5 items, icon 24dp, label 12sp.
- Center "Sell" item: 64dp raised gradient circle, 6dp glass ring, sits 34dp above the bar line.
- Avatars: 56dp (lists), 104dp (profile). Book grid cover height 140 to 150dp. Detail hero height 310dp.

### 3.6 Typography
Fonts: Plus Jakarta Sans (Latin) with Hind Siliguri (Bangla fallback). Bundle both in `res/font`.
| Role | Size / line | Weight |
|---|---|---|
| Headline | 24sp / 30 | ExtraBold (800), letter spacing -0.02em |
| Title | 18sp / 24 | Bold (700) |
| Body | 15sp / 22 | Regular (400) |
| Label | 13sp / 18 | SemiBold (600) |
| Caption | 12sp / 16 | Medium (500) |
Prices: Title size, ExtraBold, success color. Strike-through original price: Caption, inkMuted.

### 3.7 Motion [REC]
- Press: scale to 0.98, 150ms.
- Selection indicator (tab, segment): spring, damping ratio 0.7, medium stiffness (about 350 to 400ms).
- Screen change: 250ms fade plus 12dp slide, ease-out. Bottom sheet: 300ms.
- No infinite animation on scrolling lists (battery). Only the loading shimmer loops.
- Respect system "remove animations" / reduce motion: disable all of the above except instant state changes.

### 3.8 Loading skeleton (shimmer)
- Block color: light #DCE1EC, dark #2B3350. Radius matches the real element.
- One light band per card, 100deg angle, light mode white at 0.75, dark mode white at 0.12.
- 1.6s per pass, ease-in-out, repeat. Cards start 120ms apart (wave).
- Skeleton must have the SAME size as the real content (no layout jump). Announce "Loading" to screen readers.

## 4. COMPONENTS

1. **GlassSurface**: section 3.3, used by all below.
2. **GlassSearchBar**: capsule, search icon left, filter icon button (glass circle) right.
3. **GlassChip**: capsule 44dp. Normal = glass. Selected = primary gradient fill, white text.
4. **BookSetCard** (grid): cover with condition tag top-left, bookmark top-right, "N Books Set" dark chip bottom-left. Below: "4th Semester Set", "4th Sem, Civil", price, strike-through original, "% OFF" tag (computed: round(1 - price/original)).
5. **BookSetRow** (list): 82x104dp cover, title, meta, price, condition tag, bookmark.
6. **PrimaryButton**: primary gradient capsule, 56dp, white bold text. **SecondaryButton**: GlassSurface capsule.
7. **GlassField**: 20dp radius, glass fill, inner shadow, 2dp primary border on focus, red on error with message below.
8. **GlassNavBar**: section 3.5. Active item: white at 0.18 fill and 1.5dp white ring.
9. **GlassSheet**: filter/sort sheet, 32dp top radius, dim scrim black at 0.35.
10. **GlassToast**: dark capsule, 2s.
11. **ChatBubble**: mine = primary gradient, white text. Theirs = GlassSurface. Timestamp Caption below.

## 5. SCREENS (keep existing logic, restyle only)

1. **Home**: greeting + bell + avatar; glass search with filter button; three dropdowns (College, Department, Semester); "Select College" two cards (FPI, FCI) with selected ring and check; semester chips (All, 1st to 8th, horizontal scroll); departments or technologies for the chosen college; "Available Books" grid (2 columns) with live count line "FCI, All Semesters, All Tech (N books found)"; empty state message.
2. **Search**: back button, search bar, scope chips (All, Books, Subjects, Authors), "N results found", list rows.
3. **Book Detail**: hero cover with back / like / bookmark glass buttons, 2 thumbnails and counter; info card (semester, department, book count, college chips; condition and price panel); description; seller card (avatar, name, college, chat and call buttons); full-width primary "Message Seller".
4. **Sell**: college segment, department, semester, books-in-set stepper, condition segment, price, original price, description, "Post listing". Validate: department, semester, price required; original price at least price.
5. **Inbox**: search, conversation rows with unread badge. **Chat**: header with avatar, online status, call; bubbles; "Mega Deal" button; glass composer (attach, text, image, send).
6. **Profile**: avatar with camera badge, active tag, info card (email, phone, college, department, semester), account settings rows.
7. **Admin Panel** (admins only): header, section chips, 10 stat cards (users, active, suspended, banned, books, available, sold, removed, pending reports, active deals), recent activity list.

Bottom nav is visible only on Home, Search, Sell, Inbox, Profile. Hidden on Detail, Chat, Admin.

## 6. ACCESSIBILITY (must pass)

- Text contrast at least 4.5:1 on glass over the backdrop (large text 3:1). If a screen fails, raise tint for that surface. Do not change the global tint.
- Every icon button has a content description. Touch targets at least 48dp.
- Works at 200% font scale without clipping. Bangla text uses Hind Siliguri, no tofu boxes.
- Reduce motion respected (section 3.7).

## 7. PERFORMANCE RULES

- Blur only on nav bar, sheets, top bar. Maximum 2 blurred layers on screen at once.
- Lists use `LazyColumn` / `LazyVerticalGrid` with stable keys. No blur or infinite animation per item.
- Test on a mid-range device or emulator with 4GB RAM. Scrolling must stay smooth. Report what you actually measured.

## 8. FALLBACKS

| Situation | Behavior |
|---|---|
| API 31+ and blur enabled | Real backdrop blur on bars |
| API 30 and below | No blur, bar fill 72% opaque |
| Battery saver or low RAM | Same as API 30 |
| Dark mode | Section 3.2 values |

## 9. ACCEPTANCE CHECKLIST

Report each as PASS / FAIL / BLOCKED with evidence:
1. All tokens live in one theme file, none hard-coded in screens.
2. Light and dark both render on every screen.
3. Contrast measured on Home, Detail, Chat, Sell.
4. Nav bar blur works on API 31+ and falls back below.
5. Shimmer skeleton has no layout jump.
6. Existing features still work (login, listing, chat, filters, admin).
7. No blur on list items.

## 10. FINAL REPORT (write it in Bangla)

Include: (a) files changed with paths, (b) the token file contents, (c) screens restyled, (d) checklist results, (e) anything BLOCKED or not visually verified, (f) "Missing values" you stopped on.

## 11. OUT OF SCOPE

New features, payment, push notifications, iOS, redesigning screens that are not listed.
