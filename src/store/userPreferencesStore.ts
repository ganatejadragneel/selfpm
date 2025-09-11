/**
 * UserPreferencesStore - Manages user preferences and settings
 * Persisted to local storage for consistent experience
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimePreferences {
  workDayStartHour: number;
  workDayEndHour: number;
  defaultTaskDuration: number;
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, Saturday
  timeFormat: '12h' | '24h';
  timezone: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  reminderTime: number; // minutes before due
  soundEnabled: boolean;
}

interface DisplayPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  density: 'comfortable' | 'compact' | 'spacious';
  showWeekNumbers: boolean;
  showTaskIds: boolean;
  showTimeEstimates: boolean;
  autoExpandSubtasks: boolean;
  animationsEnabled: boolean;
}

interface CategoryPreferences {
  defaultCategory: string;
  categoryOrder: string[];
  hiddenCategories: string[];
  categoryColors: Record<string, string>;
}

interface ProductivityPreferences {
  pomodoroEnabled: boolean;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  dailyGoal: number; // number of pomodoros
}

interface UserPreferencesStore {
  // Preferences
  timePreferences: TimePreferences;
  notificationPreferences: NotificationPreferences;
  displayPreferences: DisplayPreferences;
  categoryPreferences: CategoryPreferences;
  productivityPreferences: ProductivityPreferences;
  
  // Quick Settings
  focusMode: boolean;
  doNotDisturb: boolean;
  
  // Custom Fields
  customFields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    required: boolean;
  }>;
  
  // Saved Filters
  savedFilters: Array<{
    id: string;
    name: string;
    filter: Record<string, any>;
  }>;
  
  // Keyboard Shortcuts
  keyboardShortcuts: Record<string, string>;
  
  // Actions - Time
  updateTimePreferences: (prefs: Partial<TimePreferences>) => void;
  setWorkingHours: (start: number, end: number) => void;
  setWeekStart: (day: 0 | 1 | 6) => void;
  
  // Actions - Notifications
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  toggleEmailNotifications: () => void;
  togglePushNotifications: () => void;
  setReminderTime: (minutes: number) => void;
  
  // Actions - Display
  updateDisplayPreferences: (prefs: Partial<DisplayPreferences>) => void;
  setTheme: (theme: DisplayPreferences['theme']) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: DisplayPreferences['fontSize']) => void;
  toggleAnimations: () => void;
  
  // Actions - Categories
  updateCategoryPreferences: (prefs: Partial<CategoryPreferences>) => void;
  setCategoryOrder: (order: string[]) => void;
  toggleCategoryVisibility: (category: string) => void;
  setCategoryColor: (category: string, color: string) => void;
  
  // Actions - Productivity
  updateProductivityPreferences: (prefs: Partial<ProductivityPreferences>) => void;
  togglePomodoroMode: () => void;
  setPomodoroTimers: (work: number, shortBreak: number, longBreak: number) => void;
  setDailyGoal: (goal: number) => void;
  
  // Actions - Quick Settings
  toggleFocusMode: () => void;
  toggleDoNotDisturb: () => void;
  
  // Actions - Custom Fields
  addCustomField: (field: Omit<UserPreferencesStore['customFields'][0], 'id'>) => void;
  updateCustomField: (id: string, updates: Partial<UserPreferencesStore['customFields'][0]>) => void;
  deleteCustomField: (id: string) => void;
  
  // Actions - Saved Filters
  saveFilter: (name: string, filter: Record<string, any>) => void;
  deleteFilter: (id: string) => void;
  
  // Actions - Keyboard Shortcuts
  updateShortcut: (action: string, shortcut: string) => void;
  resetShortcuts: () => void;
  
  // Utility
  exportPreferences: () => string;
  importPreferences: (json: string) => void;
  resetToDefaults: () => void;
}

const defaultPreferences = {
  timePreferences: {
    workDayStartHour: 9,
    workDayEndHour: 17,
    defaultTaskDuration: 30,
    weekStartsOn: 1 as const,
    timeFormat: '12h' as const,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  notificationPreferences: {
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    dailyDigest: false,
    weeklyReport: true,
    reminderTime: 15,
    soundEnabled: true
  },
  displayPreferences: {
    theme: 'system' as const,
    accentColor: '#3B82F6',
    fontSize: 'medium' as const,
    density: 'comfortable' as const,
    showWeekNumbers: true,
    showTaskIds: false,
    showTimeEstimates: true,
    autoExpandSubtasks: false,
    animationsEnabled: true
  },
  categoryPreferences: {
    defaultCategory: 'life_admin',
    categoryOrder: ['life_admin', 'work', 'weekly_recurring'],
    hiddenCategories: [],
    categoryColors: {
      life_admin: '#3B82F6',
      work: '#10B981',
      weekly_recurring: '#8B5CF6'
    }
  },
  productivityPreferences: {
    pomodoroEnabled: false,
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    dailyGoal: 8
  }
};

const defaultShortcuts = {
  'new-task': 'cmd+n',
  'search': 'cmd+k',
  'toggle-sidebar': 'cmd+b',
  'next-week': 'cmd+right',
  'prev-week': 'cmd+left',
  'mark-done': 'cmd+enter',
  'delete': 'cmd+backspace',
  'undo': 'cmd+z',
  'redo': 'cmd+shift+z',
  'focus-mode': 'cmd+f',
  'help': 'cmd+?'
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      ...defaultPreferences,
      focusMode: false,
      doNotDisturb: false,
      customFields: [],
      savedFilters: [],
      keyboardShortcuts: defaultShortcuts,
      
      // Time Actions
      updateTimePreferences: (prefs) => {
        set(state => ({
          timePreferences: { ...state.timePreferences, ...prefs }
        }));
      },
      
      setWorkingHours: (start, end) => {
        set(state => ({
          timePreferences: {
            ...state.timePreferences,
            workDayStartHour: start,
            workDayEndHour: end
          }
        }));
      },
      
      setWeekStart: (day) => {
        set(state => ({
          timePreferences: {
            ...state.timePreferences,
            weekStartsOn: day
          }
        }));
      },
      
      // Notification Actions
      updateNotificationPreferences: (prefs) => {
        set(state => ({
          notificationPreferences: { ...state.notificationPreferences, ...prefs }
        }));
      },
      
      toggleEmailNotifications: () => {
        set(state => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            emailNotifications: !state.notificationPreferences.emailNotifications
          }
        }));
      },
      
      togglePushNotifications: () => {
        set(state => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            pushNotifications: !state.notificationPreferences.pushNotifications
          }
        }));
      },
      
      setReminderTime: (minutes) => {
        set(state => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            reminderTime: minutes
          }
        }));
      },
      
      // Display Actions
      updateDisplayPreferences: (prefs) => {
        set(state => ({
          displayPreferences: { ...state.displayPreferences, ...prefs }
        }));
      },
      
      setTheme: (theme) => {
        set(state => ({
          displayPreferences: {
            ...state.displayPreferences,
            theme
          }
        }));
      },
      
      setAccentColor: (color) => {
        set(state => ({
          displayPreferences: {
            ...state.displayPreferences,
            accentColor: color
          }
        }));
      },
      
      setFontSize: (size) => {
        set(state => ({
          displayPreferences: {
            ...state.displayPreferences,
            fontSize: size
          }
        }));
      },
      
      toggleAnimations: () => {
        set(state => ({
          displayPreferences: {
            ...state.displayPreferences,
            animationsEnabled: !state.displayPreferences.animationsEnabled
          }
        }));
      },
      
      // Category Actions
      updateCategoryPreferences: (prefs) => {
        set(state => ({
          categoryPreferences: { ...state.categoryPreferences, ...prefs }
        }));
      },
      
      setCategoryOrder: (order) => {
        set(state => ({
          categoryPreferences: {
            ...state.categoryPreferences,
            categoryOrder: order
          }
        }));
      },
      
      toggleCategoryVisibility: (category) => {
        set(state => {
          const hidden = state.categoryPreferences.hiddenCategories;
          const isHidden = hidden.includes(category);
          
          return {
            categoryPreferences: {
              ...state.categoryPreferences,
              hiddenCategories: isHidden
                ? hidden.filter(c => c !== category)
                : [...hidden, category]
            }
          };
        });
      },
      
      setCategoryColor: (category, color) => {
        set(state => ({
          categoryPreferences: {
            ...state.categoryPreferences,
            categoryColors: {
              ...state.categoryPreferences.categoryColors,
              [category]: color
            }
          }
        }));
      },
      
      // Productivity Actions
      updateProductivityPreferences: (prefs) => {
        set(state => ({
          productivityPreferences: { ...state.productivityPreferences, ...prefs }
        }));
      },
      
      togglePomodoroMode: () => {
        set(state => ({
          productivityPreferences: {
            ...state.productivityPreferences,
            pomodoroEnabled: !state.productivityPreferences.pomodoroEnabled
          }
        }));
      },
      
      setPomodoroTimers: (work, shortBreak, longBreak) => {
        set(state => ({
          productivityPreferences: {
            ...state.productivityPreferences,
            pomodoroDuration: work,
            shortBreakDuration: shortBreak,
            longBreakDuration: longBreak
          }
        }));
      },
      
      setDailyGoal: (goal) => {
        set(state => ({
          productivityPreferences: {
            ...state.productivityPreferences,
            dailyGoal: goal
          }
        }));
      },
      
      // Quick Settings Actions
      toggleFocusMode: () => {
        set(state => ({ focusMode: !state.focusMode }));
      },
      
      toggleDoNotDisturb: () => {
        set(state => ({ doNotDisturb: !state.doNotDisturb }));
      },
      
      // Custom Fields Actions
      addCustomField: (field) => {
        const id = Date.now().toString();
        set(state => ({
          customFields: [...state.customFields, { ...field, id }]
        }));
      },
      
      updateCustomField: (id, updates) => {
        set(state => ({
          customFields: state.customFields.map(f =>
            f.id === id ? { ...f, ...updates } : f
          )
        }));
      },
      
      deleteCustomField: (id) => {
        set(state => ({
          customFields: state.customFields.filter(f => f.id !== id)
        }));
      },
      
      // Saved Filters Actions
      saveFilter: (name, filter) => {
        const id = Date.now().toString();
        set(state => ({
          savedFilters: [...state.savedFilters, { id, name, filter }]
        }));
      },
      
      deleteFilter: (id) => {
        set(state => ({
          savedFilters: state.savedFilters.filter(f => f.id !== id)
        }));
      },
      
      // Keyboard Shortcuts Actions
      updateShortcut: (action, shortcut) => {
        set(state => ({
          keyboardShortcuts: {
            ...state.keyboardShortcuts,
            [action]: shortcut
          }
        }));
      },
      
      resetShortcuts: () => {
        set({ keyboardShortcuts: defaultShortcuts });
      },
      
      // Utility Actions
      exportPreferences: () => {
        const state = get();
        const exportData = {
          timePreferences: state.timePreferences,
          notificationPreferences: state.notificationPreferences,
          displayPreferences: state.displayPreferences,
          categoryPreferences: state.categoryPreferences,
          productivityPreferences: state.productivityPreferences,
          customFields: state.customFields,
          savedFilters: state.savedFilters,
          keyboardShortcuts: state.keyboardShortcuts
        };
        return JSON.stringify(exportData, null, 2);
      },
      
      importPreferences: (json) => {
        try {
          const data = JSON.parse(json);
          set(data);
        } catch (error) {
          console.error('Failed to import preferences:', error);
        }
      },
      
      resetToDefaults: () => {
        set({
          ...defaultPreferences,
          focusMode: false,
          doNotDisturb: false,
          customFields: [],
          savedFilters: [],
          keyboardShortcuts: defaultShortcuts
        });
      }
    }),
    {
      name: 'user-preferences-storage',
      version: 1
    }
  )
);