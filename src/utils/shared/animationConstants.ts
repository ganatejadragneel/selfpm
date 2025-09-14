// Phase 9: Animation System Constants and Utilities
// Standardized animation values, easings, and duration constants

// Animation duration constants (in milliseconds)
export const ANIMATION_DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
} as const;

// Easing curves for consistent motion design
export const EASING_CURVES = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic-bezier easings for enhanced UX
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  snappy: 'cubic-bezier(0.68, -0.55, 0.265, 1.35)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  dramatic: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Material Design inspired
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',

  // iOS inspired
  iosSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// Animation delay constants
export const ANIMATION_DELAYS = {
  none: 0,
  short: 50,
  medium: 100,
  long: 200,
  stagger: 150, // For staggered animations
} as const;

// Transform values for common animations
export const TRANSFORM_VALUES = {
  // Scale transforms
  scaleDown: 0.95,
  scaleUp: 1.05,
  scaleNone: 1,

  // Translate values (in pixels)
  slideSmall: 8,
  slideMedium: 16,
  slideLarge: 24,
  slideHuge: 48,

  // Rotate values (in degrees)
  rotateSmall: 5,
  rotateMedium: 15,
  rotateLarge: 45,
  rotateHalf: 180,
  rotateFull: 360,
} as const;

// Opacity values for fade animations
export const OPACITY_VALUES = {
  hidden: 0,
  faint: 0.3,
  subtle: 0.6,
  visible: 0.8,
  full: 1,
} as const;

// Z-index layers for animation contexts
export const ANIMATION_LAYERS = {
  background: -1,
  base: 0,
  elevated: 10,
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  tooltip: 2000,
  toast: 3000,
  overlay: 9999,
} as const;

// Common animation property sets
export const ANIMATION_PROPERTIES = {
  // Basic transition properties
  all: 'all',
  transform: 'transform',
  opacity: 'opacity',
  color: 'color',
  backgroundColor: 'background-color',
  borderColor: 'border-color',
  boxShadow: 'box-shadow',
  width: 'width',
  height: 'height',
  padding: 'padding',
  margin: 'margin',

  // Multiple properties for complex animations
  transformOpacity: 'transform, opacity',
  colorBackground: 'color, background-color',
  sizingProperties: 'width, height, padding, margin',
  visualProperties: 'color, background-color, border-color, box-shadow',
  allExceptSize: 'transform, opacity, color, background-color, border-color, box-shadow',
} as const;

// Animation timing functions with descriptions
export const TIMING_FUNCTIONS = {
  // For micro-interactions (buttons, hovers)
  microInteraction: {
    duration: ANIMATION_DURATIONS.fast,
    easing: EASING_CURVES.smooth,
    delay: ANIMATION_DELAYS.none,
  },

  // For page transitions
  pageTransition: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_CURVES.standard,
    delay: ANIMATION_DELAYS.none,
  },

  // For modal/overlay appearances
  modalAppear: {
    duration: ANIMATION_DURATIONS.slow,
    easing: EASING_CURVES.spring,
    delay: ANIMATION_DELAYS.short,
  },

  // For loading states
  loadingPulse: {
    duration: ANIMATION_DURATIONS.slower,
    easing: EASING_CURVES.easeInOut,
    delay: ANIMATION_DELAYS.none,
  },

  // For dropdown/menu animations
  dropdown: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_CURVES.decelerate,
    delay: ANIMATION_DELAYS.none,
  },

  // For toast/notification animations
  toast: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_CURVES.spring,
    delay: ANIMATION_DELAYS.none,
  },

  // For form field focus states
  formFocus: {
    duration: ANIMATION_DURATIONS.fast,
    easing: EASING_CURVES.easeOut,
    delay: ANIMATION_DELAYS.none,
  },

  // For drag and drop interactions
  dragAndDrop: {
    duration: ANIMATION_DURATIONS.fast,
    easing: EASING_CURVES.snappy,
    delay: ANIMATION_DELAYS.none,
  },
} as const;

// Predefined animation sequences for common UI patterns
export const ANIMATION_SEQUENCES = {
  // Fade animations
  fadeIn: {
    initial: { opacity: OPACITY_VALUES.hidden },
    animate: { opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.microInteraction,
  },

  fadeOut: {
    initial: { opacity: OPACITY_VALUES.full },
    animate: { opacity: OPACITY_VALUES.hidden },
    timing: TIMING_FUNCTIONS.microInteraction,
  },

  // Scale animations
  scaleIn: {
    initial: { transform: `scale(${TRANSFORM_VALUES.scaleDown})`, opacity: OPACITY_VALUES.hidden },
    animate: { transform: `scale(${TRANSFORM_VALUES.scaleNone})`, opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.modalAppear,
  },

  scaleOut: {
    initial: { transform: `scale(${TRANSFORM_VALUES.scaleNone})`, opacity: OPACITY_VALUES.full },
    animate: { transform: `scale(${TRANSFORM_VALUES.scaleDown})`, opacity: OPACITY_VALUES.hidden },
    timing: TIMING_FUNCTIONS.modalAppear,
  },

  // Slide animations
  slideInFromTop: {
    initial: { transform: `translateY(-${TRANSFORM_VALUES.slideLarge}px)`, opacity: OPACITY_VALUES.hidden },
    animate: { transform: 'translateY(0px)', opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.dropdown,
  },

  slideInFromBottom: {
    initial: { transform: `translateY(${TRANSFORM_VALUES.slideLarge}px)`, opacity: OPACITY_VALUES.hidden },
    animate: { transform: 'translateY(0px)', opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.dropdown,
  },

  slideInFromLeft: {
    initial: { transform: `translateX(-${TRANSFORM_VALUES.slideLarge}px)`, opacity: OPACITY_VALUES.hidden },
    animate: { transform: 'translateX(0px)', opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.pageTransition,
  },

  slideInFromRight: {
    initial: { transform: `translateX(${TRANSFORM_VALUES.slideLarge}px)`, opacity: OPACITY_VALUES.hidden },
    animate: { transform: 'translateX(0px)', opacity: OPACITY_VALUES.full },
    timing: TIMING_FUNCTIONS.pageTransition,
  },

  // Bounce animation
  bounce: {
    initial: { transform: `scale(${TRANSFORM_VALUES.scaleNone})` },
    animate: { transform: `scale(${TRANSFORM_VALUES.scaleUp})` },
    timing: {
      duration: ANIMATION_DURATIONS.fast,
      easing: EASING_CURVES.bounce,
      delay: ANIMATION_DELAYS.none,
    },
  },

  // Pulse animation for loading states
  pulse: {
    initial: { opacity: OPACITY_VALUES.full },
    animate: { opacity: OPACITY_VALUES.faint },
    timing: TIMING_FUNCTIONS.loadingPulse,
  },

  // Shake animation for errors
  shake: {
    initial: { transform: 'translateX(0px)' },
    animate: { transform: `translateX(${TRANSFORM_VALUES.slideSmall}px)` },
    timing: {
      duration: ANIMATION_DURATIONS.fast,
      easing: EASING_CURVES.linear,
      delay: ANIMATION_DELAYS.none,
    },
  },
} as const;

// Animation state types for TypeScript
export type AnimationDuration = keyof typeof ANIMATION_DURATIONS;
export type EasingCurve = keyof typeof EASING_CURVES;
export type AnimationDelay = keyof typeof ANIMATION_DELAYS;
export type AnimationProperty = keyof typeof ANIMATION_PROPERTIES;
export type TimingFunction = keyof typeof TIMING_FUNCTIONS;
export type AnimationSequence = keyof typeof ANIMATION_SEQUENCES;

// Helper type for animation configuration
export interface AnimationConfig {
  duration: number | AnimationDuration;
  easing: string | EasingCurve;
  delay: number | AnimationDelay;
  properties?: string | AnimationProperty;
}

// Helper type for animation state
export interface AnimationState {
  initial: Record<string, any>;
  animate: Record<string, any>;
  timing: AnimationConfig;
}