import type { TaskCategory } from '../types';
import { addDays, addWeeks, nextFriday, nextMonday } from 'date-fns';

interface ParsedTask {
  title: string;
  description?: string;
  dueDate?: string;
  progressTotal?: number;
  subtasks?: string[];
  category?: TaskCategory;
}

export function parseTaskText(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  
  // Split by common task separators
  const lines = text.split(/[\n\r]+/);
  let currentTask: ParsedTask | null = null;
  let currentDescription: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if it's a new task (starts with number, bullet, or task keyword)
    const isNewTask = /^(\d+\.?|\-|\*|task\s+\d+:?|next\s+(task|thing):?)/i.test(trimmed);
    
    if (isNewTask || (!currentTask && trimmed)) {
      // Save previous task if exists
      if (currentTask) {
        if (currentDescription.length > 0) {
          currentTask.description = currentDescription.join(' ').trim();
        }
        tasks.push(currentTask);
        currentDescription = [];
      }
      
      // Extract task title (remove numbering/bullets)
      let title = trimmed.replace(/^(\d+\.?|\-|\*|task\s+\d+:?|next\s+(task|thing):?)\s*/i, '');
      
      // Parse progress (e.g., "read 80 pages", "complete 50 stories")
      const progressMatch = title.match(/(\d+)\s*(pages?|stories?|items?|documents?|requirements?|clarifications?)/i);
      let progressTotal: number | undefined;
      if (progressMatch) {
        progressTotal = parseInt(progressMatch[1]);
      }
      
      // Parse due date
      let dueDate: string | undefined;
      const today = new Date();
      
      if (/today/i.test(title)) {
        dueDate = today.toISOString().split('T')[0];
      } else if (/tomorrow/i.test(title)) {
        dueDate = addDays(today, 1).toISOString().split('T')[0];
      } else if (/next\s+week/i.test(title)) {
        dueDate = addWeeks(today, 1).toISOString().split('T')[0];
      } else if (/friday/i.test(title)) {
        dueDate = nextFriday(today).toISOString().split('T')[0];
      } else if (/monday/i.test(title)) {
        dueDate = nextMonday(today).toISOString().split('T')[0];
      }
      
      // Detect category based on keywords
      let category: TaskCategory | undefined;
      if (/work|user stor|requirement|clarification|evaluation|metric/i.test(title)) {
        category = 'work';
      } else if (/weekly|recurring|every week/i.test(title)) {
        category = 'weekly_recurring';
      } else {
        category = 'life_admin';
      }
      
      currentTask = {
        title: title.substring(0, 200), // Limit title length
        progressTotal,
        dueDate,
        category
      };
    } else if (currentTask) {
      // Check if it's a subtask (indented or starts with sub-task indicators)
      const isSubtask = /^(\s{2,}|\t+|[\-\*]\s+|✓|□|◯|Step\s+\d+:?|and\s+then|after\s+that|also\s+need\s+to)/i.test(line);
      
      if (isSubtask) {
        if (!currentTask.subtasks) {
          currentTask.subtasks = [];
        }
        const subtaskText = line.replace(/^(\s+|\t+|[\-\*]\s+|✓|□|◯|Step\s+\d+:?)\s*/i, '').trim();
        if (subtaskText) {
          currentTask.subtasks.push(subtaskText);
        }
      } else {
        // Add to description
        currentDescription.push(trimmed);
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    if (currentDescription.length > 0) {
      currentTask.description = currentDescription.join(' ').trim();
    }
    tasks.push(currentTask);
  }
  
  return tasks;
}

// Parse a more structured input (like the PM's example)
export function parseStructuredText(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = text.split(/[\n\r]+/);
  
  let currentTask: ParsedTask | null = null;
  let collectingSubtasks = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Match numbered tasks more precisely
    const numberMatch = trimmed.match(/^(?:task\s+)?(\d+)(?:\.|:|\))\s*(.+)/i);
    
    if (numberMatch) {
      // Save previous task
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      const taskContent = numberMatch[2];
      
      // Extract key information from task content
      const progressMatch = taskContent.match(/(\d+)\s+(?:of\s+)?(\d+)?/);
      let progressTotal: number | undefined;
      
      if (progressMatch) {
        if (progressMatch[2]) {
          progressTotal = parseInt(progressMatch[2]);
        } else {
          progressTotal = parseInt(progressMatch[1]);
        }
      }
      
      currentTask = {
        title: taskContent,
        progressTotal,
        subtasks: []
      };
      collectingSubtasks = false;
    } else if (currentTask) {
      // Check for subtask patterns
      if (/^(and |then |also |need to |have to |should |must |step \d+|first |second |third |next |finally )/i.test(trimmed)) {
        collectingSubtasks = true;
      }
      
      if (collectingSubtasks || /^[\-\*•]\s+/.test(trimmed)) {
        const subtaskText = trimmed.replace(/^[\-\*•]\s+/, '').replace(/^(and |then |also |need to |have to |should |must )/i, '');
        if (subtaskText && currentTask.subtasks) {
          currentTask.subtasks.push(subtaskText);
        }
      } else if (!currentTask.description) {
        currentTask.description = trimmed;
      }
    }
  }
  
  // Save last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}