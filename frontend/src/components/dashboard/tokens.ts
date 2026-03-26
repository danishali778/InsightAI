/* QueryMind Design Tokens — Comprehensive Design System */
export const T = {
  // ============ COLORS ============

  // BACKGROUNDS (8 depth layers)
  bg: '#060a12',        // Main background
  s1: '#0b1120',        // Surface layer 1 (deepest)
  s2: '#0f1929',        // Surface layer 2
  s3: '#141f30',        // Surface layer 3
  s4: '#1a2640',        // Surface layer 4
  s5: '#1f2d4a',        // Surface layer 5 (lightest)

  // ACCENT COLORS (Primary palette)
  accent: '#00e5ff',    // Cyan - primary accent
  accentDim: 'rgba(0,229,255,0.1)',
  purple: '#7c3aff',    // Secondary accent
  purpleDim: 'rgba(124,58,255,0.1)',
  green: '#22d3a5',     // Success/positive
  greenDim: 'rgba(34,211,165,0.1)',
  yellow: '#f59e0b',    // Warning
  yellowDim: 'rgba(245,158,11,0.1)',
  red: '#f87171',       // Error/danger
  redDim: 'rgba(248,113,113,0.1)',
  orange: '#ff6b35',    // Info
  orangeDim: 'rgba(255,107,53,0.1)',

  // TEXT COLORS (Hierarchy)
  text: '#e2e8f4',      // Primary text
  text2: '#94a3b8',     // Secondary text (muted)
  text3: '#4a5568',     // Tertiary text (very muted)

  // BORDERS
  border: 'rgba(255,255,255,0.055)',   // Subtle border
  border2: 'rgba(255,255,255,0.1)',    // Standard border

  // STATUS COLORS
  statusOnline: '#22d3a5',    // Online/connected
  statusLoading: '#f59e0b',   // Loading/pending
  statusError: '#f87171',     // Error/offline
  statusWarning: '#f59e0b',   // Warning

  // ============ TYPOGRAPHY ============
  fontHead: "'Syne', sans-serif",      // Display font
  fontMono: "'DM Mono', monospace",    // Code font
  fontBody: "'DM Sans', sans-serif",   // Body font

  // ============ SPACING (8px base unit) ============
  space: {
    0: 0,
    1: 4,      // xs
    2: 8,      // sm
    3: 12,     // md
    4: 16,     // lg
    5: 20,     // xl
    6: 24,     // 2xl
    8: 32,     // 3xl
  },

  // ============ SIZING (Component heights) ============
  size: {
    xs: 28,    // Small button/input
    sm: 32,    // Medium button/input
    md: 40,    // Standard button/input
    lg: 48,    // Large button/input
    xl: 56,    // Extra large button
  },

  // ============ BORDER RADIUS ============
  radius: {
    sm: 8,     // Subtle rounding
    md: 12,    // Standard rounding
    lg: 16,    // Large rounding
    xl: 20,    // Extra large rounding
    full: 9999, // Fully rounded (pills)
  },

  // ============ SHADOWS ============
  shadow: {
    none: 'none',
    sm: '0 2px 8px rgba(0,0,0,0.3)',
    md: '0 4px 16px rgba(0,0,0,0.4)',
    lg: '0 8px 24px rgba(0,0,0,0.5)',
    xl: '0 12px 32px rgba(0,0,0,0.6)',
    glow: '0 0 20px rgba(0, 229, 255, 0.2)',
    glowIntense: '0 0 40px rgba(0, 229, 255, 0.3)',
  },

  // ============ TRANSITIONS ============
  transition: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionShort: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionLong: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  // ============ COMPONENT-SPECIFIC TOKENS ============

  // Button Tokens
  button: {
    padding: { sm: '6px 12px', md: '8px 16px', lg: '12px 20px' },
    fontSize: { sm: '0.875rem', md: '1rem', lg: '1.125rem' },
    fontWeight: 500,
  },

  // Card Tokens
  card: {
    padding: 20,
    gap: 16,
    borderRadius: 12,
    shadow: 'rgba(0,0,0,0.3)',
  },

  // Badge Tokens
  badge: {
    height: 24,
    padding: '4px 8px',
    fontSize: '0.75rem',
    borderRadius: 6,
  },

  // Input Tokens
  input: {
    height: 40,
    padding: '10px 14px',
    fontSize: '0.9375rem',
    borderRadius: 8,
  },

  // Status Indicator
  statusIndicator: {
    size: 12,
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
} as const;
