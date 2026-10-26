/**
 * Liquid Glass Design System - Central Master Token File
 * Strict adherence to Liquid Glass Design System Master Specification.
 * No hardcoded values allowed outside of this token dictionary.
 */

export const LIQUID_GLASS_TOKENS = {
  // B1. Brand Look Metadata
  meta: {
    name: 'Liquid Glass Design System',
    version: '1.0.0',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // B2. Color Tokens (Light & Dark)
  colors: {
    light: {
      accentStart: '#4F5BD5',
      accentEnd: '#7B63E0',
      onAccent: '#FFFFFF',
      ink: '#14205C',
      inkMuted: '#3B4775',
      glassBase: { r: 255, g: 255, b: 255 },
      shadowColor: '#1E2864',
      success: '#0B6B4D',
      successBg: '#D2F3E6',
      info: '#0B5C73',
      infoBg: '#CDEFF8',
      neutral: '#434B72',
      neutralBg: '#E4E7F3',
      error: '#B3261E',
      errorBg: '#FDE3E1',
      badgeRed: '#E5352B',
    },
    dark: {
      accentStart: '#A4AEFF',
      accentEnd: '#B79CFF',
      onAccent: '#0E1230',
      ink: '#F2F5FF',
      inkMuted: '#C3CCEA',
      glassBase: { r: 60, g: 70, b: 120 },
      shadowColor: '#000000',
      success: '#7FE3C3',
      successBg: '#17423A',
      info: '#8BDDF2',
      infoBg: '#143E4D',
      neutral: '#C9CEEE',
      neutralBg: '#2F3453',
      error: '#F2B8B5',
      errorBg: '#4A2220',
      badgeRed: '#E5352B',
    },
  },

  // B3. Backdrop Specification
  backdrop: {
    light: {
      baseGradient: 'linear-gradient(160deg, #DDE6FF 0%, #EFE7FF 100%)',
    },
    dark: {
      baseGradient: 'linear-gradient(160deg, #141A33 0%, #1E1838 100%)',
    },
    blobs: [
      { color: '#7B8CFF', position: '18% 12%', radius: '44%' },
      { color: '#C79BFF', position: '88% 28%', radius: '42%' },
      { color: '#6EC8FF', position: '28% 88%', radius: '43%' },
    ],
  },

  // B4. Glass Recipe
  glass: {
    light: {
      tint: 0.40,
      tintSecondary: 0.40 * 0.45, // 0.18
      border: 'rgba(255, 255, 255, 0.42)',
      topHighlight: 'rgba(255, 255, 255, 0.60)',
      specularAlpha: 0.33,
    },
    dark: {
      tint: 0.22,
      tintSecondary: 0.22 * 0.45, // 0.099
      border: 'rgba(255, 255, 255, 0.29)',
      topHighlight: 'rgba(255, 255, 255, 0.42)',
      specularAlpha: 0.23,
    },
    selectedTintAlpha: 0.40,
    saturationBehindBlur: 1.6,
    blurLevels: {
      floatingBars: '18px', // Nav bar, top bar, bottom sheets, dialogs
      cardsAndChips: '0px', // Cards, list rows, chips, buttons (never blur repeated items)
    },
  },

  // B5. Elevation (Shadows)
  elevation: {
    level1: {
      offsetY: '8px',
      radius: '8px',
      opacity: 0.21,
      usage: 'cards, rows, chips, buttons',
    },
    level2: {
      offsetY: '12px',
      radius: '14px',
      opacity: 0.26,
      usage: 'nav bar, top bar, floating action',
    },
    level3: {
      offsetY: '16px',
      radius: '24px',
      opacity: 0.30,
      usage: 'sheets, dialogs, toasts',
    },
  },

  // B6. Shape Tokens
  shape: {
    card: '28px',
    listRow: '28px',
    hero: '28px',
    mediaPanel: '28px',
    bottomSheet: '32px',
    capsule: '9999px',
    textField: '20px',
    imageThumbnail: '18px',
    tagPill: '13px',
  },

  // B7. Spacing and Sizing (4px Grid)
  spacing: {
    scale: [4, 8, 12, 14, 16, 18, 24, 32] as const,
    screenSidePadding: '18px',
    gapBetweenCards: '14px',
    gapBetweenSections: '18px',
    cardInnerPaddingMedia: '10px',
    cardInnerPaddingText: '16px',
    minTouchTarget: '48px',
    searchBarHeight: '56px',
    chipHeight: '48px',
    chipPaddingX: '24px',
    chipGap: '12px',
    primaryButtonHeight: '56px',
    primaryButtonPaddingX: '24px',
    iconButtonSizeNormal: '46px',
    iconButtonSizeImportant: '54px',
    textFieldHeight: '54px',
    bottomNavHeight: '72px',
    bottomNavInset: '14px',
    navIconSize: '24px',
    navLabelSize: '12px',
    floatingActionSize: '64px',
    iconStrokeWidth: '1.9px',
  },

  // B8. Typography
  typography: {
    display: {
      size: '32px',
      lineHeight: '38px',
      weight: 800,
      tracking: '-0.03em',
    },
    headline: {
      size: '24px',
      lineHeight: '30px',
      weight: 800,
      tracking: '-0.02em',
    },
    title: {
      size: '18px',
      lineHeight: '24px',
      weight: 700,
      tracking: '0',
    },
    body: {
      size: '15px',
      lineHeight: '22px',
      weight: 400,
      tracking: '0',
    },
    label: {
      size: '13px',
      lineHeight: '18px',
      weight: 600,
      tracking: '0',
    },
    button: {
      size: '16px',
      lineHeight: '20px',
      weight: 700,
      tracking: '0',
    },
    caption: {
      size: '12px',
      lineHeight: '16px',
      weight: 500,
      tracking: '0',
    },
  },

  // B11. Motion Specs
  motion: {
    press: {
      scale: 0.98,
      duration: '150ms',
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
    },
    selectionSpring: {
      damping: 0.7,
      duration: '380ms',
    },
    screenChange: {
      duration: '250ms',
      easing: 'ease-out',
      slideDistance: '12px',
    },
    sheetSlide: {
      duration: '300ms',
      easing: 'ease-out',
    },
    focusOutline: '3px solid',
    focusOffset: '2px',
  },
} as const;

export type LiquidGlassThemeMode = 'light' | 'dark';
