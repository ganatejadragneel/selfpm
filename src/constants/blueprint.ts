// =====================================================
// MORNING COMMAND CENTER CONSTANTS
// Following DRY principle - single source of truth
// =====================================================

import { MAX_NOTE_LENGTH } from './dailyTasks';

// =====================================================
// CHARACTER LIMITS
// =====================================================

// Reuse existing constant for reflection
export const MAX_REFLECTION_LENGTH = MAX_NOTE_LENGTH; // 2500

// Other field limits
export const MAX_GOAL_NAME_LENGTH = 100;
export const MIN_OBJECTIVE_LENGTH = 100; // Suggestion, not enforced
export const MAX_OBJECTIVE_LENGTH = 1000;
export const MAX_METHODOLOGY_LENGTH = 2000;
export const MAX_DEPENDENCIES_LENGTH = 500;
export const MAX_AFFIRMATION_LENGTH = 300;

// Objective quality thresholds (for soft validation warnings)
export const OBJECTIVE_QUALITY_THRESHOLDS = {
  warning: 50,    // Less than this: show warning
  partial: 100,   // Between warning and good: show partial indicator
  good: 100,      // At or above this: show good indicator
} as const;

// =====================================================
// GOAL CONSTRAINTS
// =====================================================

export const MIN_GOALS_PER_DAY = 1;
export const MAX_GOALS_PER_DAY = 4;
export const GOAL_COUNT_OPTIONS = [1, 2, 3, 4] as const;

// =====================================================
// PPVEP AFFIRMATION GUIDELINES
// =====================================================

export const PPVEP_GUIDELINES = {
  title: 'PPVEP Affirmation Format',
  description: 'Effective affirmations follow the PPVEP structure:',
  guidelines: [
    {
      letter: 'P',
      term: 'Present',
      description: 'Use present tense (I am, I feel, I see)',
      example: '"I am" not "I will be"',
    },
    {
      letter: 'P',
      term: 'Positive',
      description: 'Focus on what you want, not what you avoid',
      example: '"I feel energized" not "I don\'t feel tired"',
    },
    {
      letter: 'V',
      term: 'Personal',
      description: 'Use first person (I, me, my)',
      example: '"I see myself succeeding"',
    },
    {
      letter: 'E',
      term: 'Emotional',
      description: 'Include feeling words',
      example: '"I feel proud", "I am excited"',
    },
    {
      letter: 'P',
      term: 'Visual',
      description: 'Describe what you see or imagine',
      example: '"I see myself completing the workout with strong form"',
    },
  ],
  fullExample: 'Example: "I feel energized and focused as I see myself completing this workout with strong form, and I am proud of my commitment."',
} as const;

export const PPVEP_SHORT_REMINDER = `
Guidelines: Present tense • Positive language • Personal (I/me) • Emotional (feelings) • Visual (see/imagine)
`.trim();

// =====================================================
// UI LABELS & MESSAGES
// =====================================================

export const UI_LABELS = {
  // Morning Flow
  morningFlowTitle: 'Morning Command Center',
  morningFlowSubtitle: 'Prepare your nervous system for the day ahead',
  goalCountQuestion: 'How many goals will you prepare for today?',
  startPreparation: 'Start Preparation',

  // Goal Prep
  goalPrepTitle: (current: number, total: number) => `Goal ${current} of ${total}`,
  goalName: 'Goal Name',
  goalNamePlaceholder: 'e.g., Morning workout',
  objective: 'Objective (what success looks like)',
  objectivePlaceholder: 'Describe in detail what it means to achieve this goal...',
  objectiveHint: (min: number) => `Aim for at least ${min} characters for clarity`,
  methodology: 'Methodology (your approach)',
  methodologyPlaceholder: 'Break down the steps you\'ll take...',
  dependencies: 'Dependencies (what needs to be true)',
  dependenciesPlaceholder: 'e.g., Need gym access, need quiet workspace, need ingredients...',
  affirmation: 'Affirmation (PPVEP format)',
  affirmationPlaceholder: 'Write a present-tense, positive affirmation...',
  saveAndNext: 'Save & Next Goal',
  saveAndFinish: 'Save & Finish',

  // Evening Reflection
  eveningReflectionTitle: 'Evening Reflection',
  eveningReflectionSubtitle: 'Review your day and track patterns',
  goalReflectionTitle: (current: number, total: number) => `Reflection ${current} of ${total}`,
  outcomeQuestion: 'Did you achieve this goal?',
  reflectionLabel: 'Reflection',
  reflectionPlaceholder: 'What happened? What did you learn? What would you do differently?',
  visualizationQuestion: 'Did morning visualization help?',
  identityPressureQuestion: 'Identity pressure during task?',

  // Weekly Analytics
  weeklyAnalyticsTitle: 'Weekly Patterns',
  goalCompletionSection: 'Goal Completion',
  visualizationEffectivenessSection: 'Visualization Effectiveness',
  identityPressureSection: 'Identity Pressure Trends',
  topGoalsSection: 'Most Common Goals',
  insightsSection: 'Pattern Insights',

  // Common
  loading: 'Loading...',
  error: 'An error occurred',
  close: 'Close',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
} as const;

export const ERROR_MESSAGES = {
  blueprintNotFound: 'Blueprint not found for this date',
  goalNotFound: 'Goal not found',
  createBlueprintFailed: 'Failed to create daily blueprint',
  updateGoalFailed: 'Failed to update goal',
  deleteGoalFailed: 'Failed to delete goal',
  fetchStatsFailed: 'Failed to load weekly statistics',
  invalidGoalCount: `Goal count must be between ${MIN_GOALS_PER_DAY} and ${MAX_GOALS_PER_DAY}`,
  reflectionTooLong: `Reflection must be ${MAX_REFLECTION_LENGTH} characters or less`,
  objectiveTooShort: `Objective should be at least ${MIN_OBJECTIVE_LENGTH} characters for clarity`,
  requiredField: 'This field is required',
} as const;

// =====================================================
// ANALYTICS CONSTANTS
// =====================================================

export const DEFAULT_ANALYTICS_DAYS = 7; // Last 7 days
export const IDENTITY_PRESSURE_SCALE = {
  none: 0,
  mild: 1,
  moderate: 2,
  high: 3,
  overwhelming: 4,
} as const;

// =====================================================
// VALIDATION RULES
// =====================================================

export const VALIDATION_RULES = {
  goalName: {
    required: true,
    maxLength: MAX_GOAL_NAME_LENGTH,
  },
  objective: {
    required: true,
    minLength: MIN_OBJECTIVE_LENGTH, // Soft requirement
    maxLength: MAX_OBJECTIVE_LENGTH,
  },
  methodology: {
    required: true,
    maxLength: MAX_METHODOLOGY_LENGTH,
  },
  dependencies: {
    required: false,
    maxLength: MAX_DEPENDENCIES_LENGTH,
  },
  affirmation: {
    required: false,
    maxLength: MAX_AFFIRMATION_LENGTH,
  },
  reflection: {
    required: true,
    maxLength: MAX_REFLECTION_LENGTH,
  },
} as const;
