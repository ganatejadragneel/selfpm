// Daily Task Constants - Shared across components to avoid duplication

// 30-color palette progressing from lighter to darker shades
export const DROPDOWN_COLORS = [
  '#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706', '#b45309', // yellows (light to dark)
  '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', // blues (light to dark)  
  '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', // greens (light to dark)
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#ec4899', '#db2777', '#be185d', // pinks (light to dark)
  '#f3e8ff', '#ddd6fe', '#c4b5fd', '#a855f7', '#9333ea', '#7c2d12', // purples (light to dark)
  '#fed7d7', '#feb2b2', '#fc8181', '#f56565', '#e53e3e', '#c53030', // reds (light to dark)
] as const;

export const NO_SELECTION_COLOR = '#ef4444'; // Red for empty dropdown selections

// Daily task constraints
export const MAX_DROPDOWN_OPTIONS = 30;
export const MAX_NOTE_LENGTH = 200;

// Display value formatters
export const getDisplayValue = (val: string, taskType: string): string => {
  if (!val) return 'No data';
  if (taskType === 'yes_no') {
    return val === 'Done' ? '✓ Done' : val === 'Not Done' ? '✗ Not Done' : val;
  }
  // For dropdown tasks, show "No selection" if empty
  if (!val || val.trim() === '') {
    return 'No selection';
  }
  return val;
};

// Color getter for dropdown tasks based on option position
export const getDropdownColor = (value: string, options: string[]): string => {
  if (!value || value.trim() === '') {
    return NO_SELECTION_COLOR; // Red for no selection
  }
  
  // Find the position of this value in the options array
  const optionIndex = options.indexOf(value);
  
  if (optionIndex >= 0 && optionIndex < DROPDOWN_COLORS.length) {
    return DROPDOWN_COLORS[optionIndex];
  } else {
    // Fallback for values not found in options or exceeding 30 colors
    return '#f3f4f6';
  }
};