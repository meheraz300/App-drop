# LIQUID GLASS DESIGN SYSTEM: MASTER PROMPT (works for any app)

How to use: fill the 5 blanks in PART A. Leave PART B and PART C untouched. Paste everything into your AI tool (attach reference images if you have them).

---

## PART A: YOUR FORM (fill these in)

```
APP NAME:            ______________________
PLATFORM:            ______  (Android Compose / iOS SwiftUI / Flutter / Web)
SCREENS TO BUILD:    ______________________  (list them, one per line)
ACCENT OVERRIDE:     none   (or two hex colors: start, end)
REPORT LANGUAGE:     ______  (for example Bangla)
```

If ACCENT OVERRIDE is "none", use the default accent in PART B.

---

## PART B: THE DESIGN SYSTEM (exact values, do not change)

### B0. Rules for the AI
1. Use ONLY the values in this document. If a value is missing, stop and list it under "Missing values". Do not guess.
2. Put all tokens in ONE central theme file. No hard-coded colors, sizes, radii, shadows or durations inside screens.
3. Do not invent extra colors, fonts, effects or components.
4. Output the finished token file in your report so it can be checked against this document.
5. Say PASS / FAIL / BLOCKED for every checklist item in PART C. Never write PASS for something you did not run or look at.

### B1. Look in one sentence
Soft translucent glass surfaces with a thin bright edge and a soft top highlight, floating on a calm colored backdrop, with an indigo-violet gradient accent and soft low-contrast shadows.

### B2. Color tokens

Light mode
| Token | Value |
|---|---|
| accentStart | #4F5BD5 |
| accentEnd | #7B63E0 |
| onAccent | #FFFFFF |
| ink (primary text) | #14205C |
| inkMuted (secondary text) | #3B4775 |
| glassBase (RGB) | 255, 255, 255 |
| shadowColor | #1E2864 |
| success / successBg | #0B6B4D / #D2F3E6 |
| info / infoBg | #0B5C73 / #CDEFF8 |
| neutral / neutralBg | #434B72 / #E4E7F3 |
| error / errorBg | #B3261E / #FDE3E1 |
| badgeRed | #E5352B |

Dark mode
| Token | Value |
|---|---|
| accentStart | #A4AEFF |
| accentEnd | #B79CFF |
| onAccent | #0E1230 |
| ink | #F2F5FF |
| inkMuted | #C3CCEA |
| glassBase (RGB) | 60, 70, 120 |
| shadowColor | #000000 |
| success / successBg | #7FE3C3 / #17423A |
| info / infoBg | #8BDDF2 / #143E4D |
| neutral / neutralBg | #C9CEEE / #2F3453 |
| error / errorBg | #F2B8B5 / #4A2220 |

Rule: text on glass must reach 4.5:1 contrast (large text 3:1). If a surface fails, raise ITS tint, never the global tint.

### B3. Backdrop (what the glass sits on)
Glass only looks like glass over color. Every screen gets one static backdrop behind all content. Never animate it.
| Mode | Spec |
|---|---|
| Light | base: linear gradient 160deg #DDE6FF to #EFE7FF |
| Dark | base: linear gradient 160deg #141A33 to #1E1838 |
| Both | plus 3 soft radial blobs, each fading to transparent by about 42 to 44% radius: #7B8CFF at (18%, 12%), #C79BFF at (88%, 28%), #6EC8FF at (28%, 88%) |

### B4. Glass recipe (one reusable Surface component)
| Property | Value |
|---|---|
| Fill | 135deg linear gradient: glassBase at tint alpha, to glassBase at tint x 0.45 |
| tint (fill alpha) | 0.40 in light, 0.22 in dark (0.40 x 0.55) |
| Border | 1dp, white at 0.42 light / 0.29 dark |
| Top inner highlight | 1.5dp line on the top edge, white at 0.60 light / 0.42 dark |
| Specular overlay | radial white gradient, 0.33 light / 0.23 dark, centered at 20% x, -10% y, fades to nothing by 55% |
| Shadow | see elevation levels B5 |
| Selected tint (chips, active tab) | accentStart at 0.40 alpha |
| Saturation behind blur | 1.6x |

Blur levels
| Where | Blur |
|---|---|
| Bars that sit over scrolling content (nav bar, top bar), bottom sheets, dialogs | 18dp |
| Cards, list rows, chips, buttons, anything repeated in a list | 0dp (never blur repeated items) |

### B5. Elevation (shadows)
| Level | Used for | Offset Y | Radius | Opacity | Color |
|---|---|---|---|---|---|
| 1 | cards, rows, chips, buttons | 8dp | 8dp | 0.21 | shadowColor |
| 2 | nav bar, top bar, floating action | 12dp | 14dp | 0.26 | shadowColor |
| 3 | sheets, dialogs, toasts | 16dp | 24dp | 0.30 | shadowColor |
Shadow X offset is always 0. Never use hard black shadows in light mode.

### B6. Shape
| Element | Radius |
|---|---|
| Card, list row, hero, media panel | 28dp |
| Bottom sheet | 32dp (top corners only) |
| Buttons, search bar, chips, nav bar, tags, toggles | full capsule (999dp) |
| Text field | 20dp |
| Image / thumbnail inside a card | 18dp |
| Small pill / tag | 12 to 14dp |

### B7. Spacing and sizes (4dp grid)
| Item | Value |
|---|---|
| Spacing scale | 4, 8, 12, 14, 16, 18, 24, 32 |
| Screen side padding | 18dp |
| Gap between cards | 14dp |
| Gap between sections | 18dp |
| Card inner padding | 10 to 16dp (10 for media cards, 16 for text cards) |
| Minimum touch target | 48dp x 48dp |
| Search bar height | 56dp |
| Chip height | 48dp, horizontal padding 24dp, gap 12dp |
| Primary button height | 56 to 58dp, horizontal padding 24dp |
| Icon button | 46 to 54dp circle |
| Text field height | 54dp |
| Bottom nav bar | height about 72dp, 14dp inset from screen sides and bottom, 5 items max |
| Nav icon / label | 24dp icon, 12sp label |
| Floating center action (optional) | 64dp circle, accent gradient, 6dp glass ring, raised 34dp above the bar |
| Avatar | 46, 56, 104 dp |
| Icon stroke | 24dp icons, 1.9dp stroke, rounded caps and joins |

### B8. Typography
Font: Plus Jakarta Sans for Latin. Hind Siliguri as the Bangla fallback. (Swap the font only if the app owner names another.)
| Role | Size / line | Weight | Notes |
|---|---|---|---|
| Display | 32sp / 38 | ExtraBold 800 | tracking -0.03em |
| Headline | 24sp / 30 | ExtraBold 800 | tracking -0.02em |
| Title | 18sp / 24 | Bold 700 | |
| Body | 15sp / 22 | Regular 400 | |
| Label | 13sp / 18 | SemiBold 600 | buttons 16sp Bold |
| Caption | 12sp / 16 | Medium 500 | inkMuted color |
Text color: ink for primary, inkMuted for secondary. Never use pure black or pure white text on glass in light mode.

### B9. Components (every state defined)

Common states for every interactive component:
- Default: as specified below.
- Pressed: scale 0.98, shadow level drops by one step, 150ms.
- Focus: 3dp outline in accentStart, offset 2dp.
- Disabled: 40% opacity, no press effect.

| Component | Spec |
|---|---|
| Surface | the glass recipe B4, radius per B6 |
| Primary button | accent gradient 135deg (start to end), onAccent bold 16sp text, capsule, 56 to 58dp, 1.5dp white border at 0.55, shadow level 1 colored with accentStart at 0.4 |
| Secondary button | Surface, capsule, ink text |
| Icon button | Surface circle 46dp (54dp for important actions) |
| Chip | Surface capsule 48dp. Selected: accent gradient fill, onAccent text |
| Segmented control | Surface capsule, 46dp segments, selected segment gets the accent gradient |
| Search bar | Surface capsule 56dp, 18dp start padding, leading icon 22dp, optional trailing icon button 46dp |
| Text field | 20dp radius, glass fill, inner shadow, 1.5dp border; focus = 2dp accentStart border; error = 2dp error border plus error text (Caption) under it |
| Card | Surface 28dp radius, padding 10 to 16 |
| List row | Card with a leading media (avatar or thumbnail), text column (Title + Caption), optional trailing action |
| Tag / status pill | 12 to 14dp radius, Caption bold, semantic bg + text pair from B2 |
| Badge (count) | 24dp high capsule, badgeRed, white 12sp bold |
| Toggle | 56 x 32 capsule, off = glass, on = accent gradient, 26dp white knob |
| Nav bar | Surface capsule with 18dp blur, shadow level 2. Active item: white at 0.18 fill + 1.5dp white ring, label in ink; inactive: inkMuted |
| Bottom sheet | Surface, 32dp top radius, 18dp blur, shadow level 3, scrim black at 0.35 |
| Toast | dark capsule (black at 0.82, white text), 2s, shadow level 3 |
| Skeleton | see B11 |

### B10. Layout rules
- One column, content scrolls under the bars. Bars float with the inset from B7.
- Leave room for the bar at the end of every scroll (nav height + inset + 24dp).
- Sections: Title (18sp bold) with optional right-aligned action. 18dp above and below.
- Cards in grids: 2 columns, equal widths, 14dp gap.
- Headers: left-aligned text block, right-aligned icon buttons.
- Content must never touch the screen edge. 18dp minimum.
- Use at most 2 blurred layers on screen at once.

### B11. Motion
| Interaction | Spec |
|---|---|
| Press | scale 0.98, 150ms, ease-out |
| Selection indicator (tab, segment, toggle) | spring: damping ratio 0.7, medium stiffness (about 350 to 400ms) |
| Screen change | 250ms: fade + 12dp slide, ease-out |
| Sheet / dialog | 300ms slide, ease-out |
| Loading skeleton | block color light #DCE1EC / dark #2B3350; one light band per card at 100deg, white at 0.75 light / 0.12 dark; 1.6s ease-in-out loop; cards start 120ms apart; skeleton has the same size as the final content (no layout jump) |
Nothing else may loop forever. If the system "reduce motion" setting is on: no animation except instant state changes.

### B12. States every screen needs
- Loading: skeletons (B11).
- Empty: one Surface card, centered Body text in inkMuted, one clear next step.
- Error: Surface card with the message and a secondary "Retry" button.
- Offline: Caption banner under the header, show cached content.

### B13. Accessibility
- Contrast per B2. Touch targets 48dp. Every icon-only control has a text label for screen readers.
- Works at 200% font scale without clipping.
- Never rely on color alone: status pills also carry text.
- Reduce-motion respected (B11).

### B14. Performance and fallbacks
| Situation | Behavior |
|---|---|
| Platform supports real backdrop blur | blur on bars, sheets, dialogs only (B4) |
| No real backdrop blur (old OS, low power, low memory) | no blur; raise the fill of those surfaces to 0.72 opacity so text stays readable |
| Lists | virtualized/lazy, stable keys, no blur and no infinite animation per item |
Platform notes: Android Compose has no built-in backdrop blur, so use a blur library such as Haze or RenderEffect on API 31+. iOS 26+ can use the system Liquid Glass effect and fall back to a thin material below it. Web uses backdrop-filter with a solid fallback.

---

## PART C: DELIVERY CHECKLIST (report PASS / FAIL / BLOCKED with evidence)

1. All tokens from PART B live in one theme file and appear in your report.
2. No hard-coded colors, sizes, radii, shadows or durations in screen code.
3. Light and dark both render on every screen from the form.
4. Contrast measured on at least the busiest screen, both modes.
5. Blur appears only where B4 allows it. Repeated items have none.
6. Every component has default, pressed, focus, disabled and (where relevant) error states.
7. Loading, empty and error states exist for every screen.
8. Reduce-motion and 200% font scale tested.
9. List what you could not check visually.

Write the final report in the REPORT LANGUAGE from PART A.
