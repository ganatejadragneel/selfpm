/**
 * Utility functions for handling combined task values (main|alt format)
 */

export interface ParsedTaskValue {
  main: string;
  alt: string;
}

/**
 * Parse a combined task value into main and alt components
 * Format: "MainStatus|AltStatus"
 * Examples:
 * - "Done|Done" -> { main: "Done", alt: "Done" }
 * - "Done" -> { main: "Done", alt: "" } (backward compatible)
 * - "|Done" -> { main: "", alt: "Done" }
 */
export function parseTaskValue(value: string | undefined | null): ParsedTaskValue {
  if (!value) {
    return { main: '', alt: '' };
  }
  
  // Check if it's the new format with pipe separator
  if (value.includes('|')) {
    const [main = '', alt = ''] = value.split('|');
    return { main, alt };
  }
  
  // Old format - treat as main task only
  return { main: value, alt: '' };
}

/**
 * Create a combined task value from main and alt statuses
 * @param mainStatus - The main task status ("Done", "Not Done", or "")
 * @param altStatus - The alt task status ("Done", "Not Done", or "")
 * @returns Combined value string
 */
export function createTaskValue(mainStatus: string, altStatus: string): string {
  // If no alt status, return just the main status (backward compatible)
  if (!altStatus) {
    return mainStatus;
  }
  
  // Return combined format
  return `${mainStatus}|${altStatus}`;
}

/**
 * Check if the main task is completed
 */
export function isMainTaskDone(value: string | undefined | null): boolean {
  const { main } = parseTaskValue(value);
  return main === 'Done';
}

/**
 * Check if the alt task is completed
 */
export function isAltTaskDone(value: string | undefined | null): boolean {
  const { alt } = parseTaskValue(value);
  return alt === 'Done';
}

/**
 * Get display value for UI
 */
export function getMainTaskDisplay(value: string | undefined | null): string {
  const { main } = parseTaskValue(value);
  return main || '';
}

/**
 * Get alt task display value for UI
 */
export function getAltTaskDisplay(value: string | undefined | null): string {
  const { alt } = parseTaskValue(value);
  return alt || '';
}