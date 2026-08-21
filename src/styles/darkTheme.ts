// Dark Theme — the Year 2 look: near-black with a violet cast, one accent, glow
// used sparingly to mark the live/active thing rather than as decoration.
//
// This is becoming THE theme (light is retained for now but no longer the
// default). Keys are unchanged from the light theme so every consumer keeps
// working; only the values move.
export const darkTheme = {
  colors: {
    primary: {
      // The single accent. Violet at three depths — chip fills, hovers, and the
      // solid used for the one active element on a screen.
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      light: 'rgba(167, 139, 250, 0.10)',
      medium: 'rgba(167, 139, 250, 0.18)',
      dark: '#a78bfa',
    },
    surface: {
      // Cards sit just above the page, tinted violet rather than neutral grey —
      // that tint is most of why the mockup reads as one system.
      glass: 'rgba(24, 19, 38, 0.82)',
      glassBorder: 'rgba(167, 139, 250, 0.14)',
      white: '#171225',

      // ── Depth ────────────────────────────────────────────────────────────
      // Cards are gradients, not flat fills. Lit from the top-left and falling
      // away to the bottom-right, so a wall of cards reads as surfaces at
      // different depths instead of identical rectangles. Same hue throughout —
      // only luminance moves.
      card: 'linear-gradient(155deg, rgba(38, 30, 59, 0.92) 0%, rgba(23, 18, 37, 0.92) 55%, rgba(16, 12, 27, 0.94) 100%)',

      // The ONE card that is live right now (today's target, a running action).
      // A violet bloom in the upper area lifts it above its neighbours without a
      // border, a badge, or a second colour. Use once per screen.
      cardLive:
        'radial-gradient(130% 95% at 62% -15%, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.06) 42%, transparent 72%), ' +
        'linear-gradient(155deg, rgba(40, 31, 63, 0.92) 0%, rgba(20, 15, 33, 0.94) 100%)',
    },
    background: {
      primary: '#0a0711',
      secondary: '#0f0b1a',
      tertiary: '#171225',
    },
    status: {
      success: {
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        light: 'rgba(52, 211, 153, 0.10)',
        medium: 'rgba(52, 211, 153, 0.18)',
        dark: '#34d399',
      },
      info: {
        gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
        light: 'rgba(129, 140, 248, 0.10)',
        medium: 'rgba(129, 140, 248, 0.18)',
        dark: '#818cf8',
      },
      warning: {
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        light: 'rgba(251, 191, 36, 0.10)',
        medium: 'rgba(251, 191, 36, 0.18)',
        dark: '#fbbf24',
      },
      error: {
        gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
        light: 'rgba(251, 113, 133, 0.10)',
        medium: 'rgba(251, 113, 133, 0.18)',
        dark: '#fb7185',
      },
      purple: {
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        light: 'rgba(167, 139, 250, 0.10)',
        medium: 'rgba(167, 139, 250, 0.18)',
        dark: '#a78bfa',
      },
    },
    text: {
      primary: '#ece9f5',
      secondary: '#a49dbb',
      muted: '#6f6885',
    },
    border: {
      light: 'rgba(167, 139, 250, 0.12)',
      medium: 'rgba(167, 139, 250, 0.22)',
    },
  },

  effects: {
    blur: 'blur(16px)',
    // Glow marks the ONE live element on a screen. If more than one thing glows,
    // nothing does.
    // Data gradients: a bar or an area is brightest where the value is and
    // falls to almost nothing at its base, so magnitude reads as light.
    dataFill: {
      /** Bars: bright at the top, fading toward the baseline. */
      bar: 'linear-gradient(180deg, rgba(167, 139, 250, 0.80) 0%, rgba(139, 92, 246, 0.38) 55%, rgba(109, 40, 217, 0.16) 100%)',
      /** The single emphasised bar — full accent, not a ramp. */
      barActive: 'linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%)',
      /** Area charts: accent fading to transparent at the axis. */
      area: 'linear-gradient(180deg, rgba(139, 92, 246, 0.34) 0%, rgba(139, 92, 246, 0.02) 100%)',
    },
    glow: {
      accent: '0 0 24px rgba(139, 92, 246, 0.35)',
      accentStrong: '0 0 36px rgba(139, 92, 246, 0.55)',
      inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    },
    shadow: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.24)',
      md: '0 4px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.25), 0 6px 6px rgba(0, 0, 0, 0.22)',
      xl: '0 15px 35px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2)',
    },
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  
  typography: {
    sizes: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '15px',
      xl: '16px',
      '2xl': '18px',
      '3xl': '20px',
      '4xl': '24px',
      '5xl': '28px',
      '6xl': '48px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    families: {
      /** Metadata, counters, timestamps — anything read as data rather than prose. */
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    /**
     * The micro-label: small, uppercase, widely letterspaced. Used for every
     * section header and unit caption ("THIS WEEK SO FAR", "GOAL 7/DAY"). This
     * one style carries most of the designed feel — it is what separates a label
     * from the value it labels without needing a rule, a box, or a colour.
     */
    label: {
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.11em',
      textTransform: 'uppercase',
    },
    /** Hero numerals: the metric itself, tight and large. */
    metric: {
      fontSize: '56px',
      fontWeight: '700',
      letterSpacing: '-0.03em',
      lineHeight: 1,
    },
  },
} as const;

// Dark mode category configurations
export const darkCategoryConfigs = {
  life_admin: {
    title: 'Life Admin',
    emoji: '🏠',
    gradient: 'linear-gradient(135deg, #1f6feb 0%, #0969da 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(31, 111, 235, 0.05) 0%, rgba(9, 105, 218, 0.02) 100%)',
    borderColor: 'rgba(31, 111, 235, 0.2)',
    accentColor: '#388bfd',
  },
  work: {
    title: 'Work Tasks',
    emoji: '💼',
    gradient: 'linear-gradient(135deg, #238636 0%, #196c2e 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(35, 134, 54, 0.05) 0%, rgba(25, 108, 46, 0.02) 100%)',
    borderColor: 'rgba(35, 134, 54, 0.2)',
    accentColor: '#2ea043',
  },
  weekly_recurring: {
    title: 'Weekly Tasks',
    emoji: '🔄',
    gradient: 'linear-gradient(135deg, #8957e5 0%, #6639ba 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(137, 87, 229, 0.05) 0%, rgba(102, 57, 186, 0.02) 100%)',
    borderColor: 'rgba(137, 87, 229, 0.2)',
    accentColor: '#a371f7',
  },
} as const;

// Dark mode priority configurations
export const darkPriorityConfigs = {
  low: {
    title: 'Low Priority',
    color: '#6e7681',
    bgColor: 'rgba(110, 118, 129, 0.08)',
    borderColor: 'rgba(110, 118, 129, 0.2)',
    icon: '🟢'
  },
  medium: {
    title: 'Medium Priority',
    color: '#e3b341',
    bgColor: 'rgba(227, 179, 65, 0.08)',
    borderColor: 'rgba(227, 179, 65, 0.2)',
    icon: '🟡'
  },
  high: {
    title: 'High Priority',
    color: '#f85149',
    bgColor: 'rgba(248, 81, 73, 0.08)',
    borderColor: 'rgba(248, 81, 73, 0.2)',
    icon: '🟠'
  },
  urgent: {
    title: 'Extreme Priority',
    color: '#da3633',
    bgColor: 'rgba(218, 54, 51, 0.12)',
    borderColor: 'rgba(218, 54, 51, 0.3)',
    icon: '🔴'
  }
} as const;