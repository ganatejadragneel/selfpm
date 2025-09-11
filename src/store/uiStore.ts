/**
 * UIStore - Manages UI state separately from business logic
 * Following Single Responsibility Principle
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalState {
  isOpen: boolean;
  taskId?: string;
  mode?: 'create' | 'edit' | 'view';
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIStore {
  // Modal States
  taskModal: ModalState;
  bulkUploadModal: boolean;
  analyticsModal: boolean;
  dependencyModal: ModalState;
  settingsModal: boolean;
  
  // Sidebar & Layout
  sidebarCollapsed: boolean;
  viewMode: 'board' | 'list' | 'calendar' | 'timeline';
  compactMode: boolean;
  
  // Notifications
  toasts: ToastMessage[];
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
  }>;
  unreadCount: number;
  
  // Loading States
  globalLoading: boolean;
  loadingMessage?: string;
  
  // Drag & Drop
  isDragging: boolean;
  draggedTaskId?: string;
  dropTargetCategory?: string;
  
  // Keyboard Shortcuts
  shortcutsEnabled: boolean;
  commandPaletteOpen: boolean;
  
  // Tour/Onboarding
  tourActive: boolean;
  tourStep: number;
  hasCompletedTour: boolean;
  
  // Actions - Modals
  openTaskModal: (taskId?: string, mode?: 'create' | 'edit' | 'view') => void;
  closeTaskModal: () => void;
  toggleBulkUploadModal: () => void;
  toggleAnalyticsModal: () => void;
  openDependencyModal: (taskId: string) => void;
  closeDependencyModal: () => void;
  toggleSettingsModal: () => void;
  
  // Actions - Layout
  toggleSidebar: () => void;
  setViewMode: (mode: UIStore['viewMode']) => void;
  toggleCompactMode: () => void;
  
  // Actions - Notifications
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  addNotification: (title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Actions - Drag & Drop
  startDrag: (taskId: string) => void;
  endDrag: () => void;
  setDropTarget: (category?: string) => void;
  
  // Actions - Keyboard
  toggleShortcuts: () => void;
  toggleCommandPalette: () => void;
  
  // Actions - Tour
  startTour: () => void;
  nextTourStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  
  // Utility
  reset: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial State
      taskModal: { isOpen: false },
      bulkUploadModal: false,
      analyticsModal: false,
      dependencyModal: { isOpen: false },
      settingsModal: false,
      
      sidebarCollapsed: false,
      viewMode: 'board',
      compactMode: false,
      
      toasts: [],
      notifications: [],
      unreadCount: 0,
      
      globalLoading: false,
      loadingMessage: undefined,
      
      isDragging: false,
      draggedTaskId: undefined,
      dropTargetCategory: undefined,
      
      shortcutsEnabled: true,
      commandPaletteOpen: false,
      
      tourActive: false,
      tourStep: 0,
      hasCompletedTour: false,
      
      // Modal Actions
      openTaskModal: (taskId, mode = 'edit') => {
        set({ 
          taskModal: { 
            isOpen: true, 
            taskId, 
            mode 
          } 
        });
      },
      
      closeTaskModal: () => {
        set({ 
          taskModal: { isOpen: false } 
        });
      },
      
      toggleBulkUploadModal: () => {
        set(state => ({ 
          bulkUploadModal: !state.bulkUploadModal 
        }));
      },
      
      toggleAnalyticsModal: () => {
        set(state => ({ 
          analyticsModal: !state.analyticsModal 
        }));
      },
      
      openDependencyModal: (taskId) => {
        set({ 
          dependencyModal: { 
            isOpen: true, 
            taskId 
          } 
        });
      },
      
      closeDependencyModal: () => {
        set({ 
          dependencyModal: { isOpen: false } 
        });
      },
      
      toggleSettingsModal: () => {
        set(state => ({ 
          settingsModal: !state.settingsModal 
        }));
      },
      
      // Layout Actions
      toggleSidebar: () => {
        set(state => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        }));
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      toggleCompactMode: () => {
        set(state => ({ 
          compactMode: !state.compactMode 
        }));
      },
      
      // Notification Actions
      showToast: (type, message, duration = 5000) => {
        const id = Date.now().toString();
        const toast: ToastMessage = { id, type, message, duration };
        
        set(state => ({ 
          toasts: [...state.toasts, toast] 
        }));
        
        // Auto-dismiss after duration
        if (duration > 0) {
          setTimeout(() => {
            get().dismissToast(id);
          }, duration);
        }
      },
      
      dismissToast: (id) => {
        set(state => ({ 
          toasts: state.toasts.filter(t => t.id !== id) 
        }));
      },
      
      clearToasts: () => {
        set({ toasts: [] });
      },
      
      addNotification: (title, message) => {
        const notification = {
          id: Date.now().toString(),
          title,
          message,
          read: false,
          timestamp: new Date()
        };
        
        set(state => ({ 
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
      },
      
      markNotificationRead: (id) => {
        set(state => {
          const notifications = state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = notifications.filter(n => !n.read).length;
          
          return { notifications, unreadCount };
        });
      },
      
      clearNotifications: () => {
        set({ 
          notifications: [], 
          unreadCount: 0 
        });
      },
      
      // Loading Actions
      setGlobalLoading: (loading, message) => {
        set({ 
          globalLoading: loading, 
          loadingMessage: message 
        });
      },
      
      // Drag & Drop Actions
      startDrag: (taskId) => {
        set({ 
          isDragging: true, 
          draggedTaskId: taskId 
        });
      },
      
      endDrag: () => {
        set({ 
          isDragging: false, 
          draggedTaskId: undefined,
          dropTargetCategory: undefined 
        });
      },
      
      setDropTarget: (category) => {
        set({ dropTargetCategory: category });
      },
      
      // Keyboard Actions
      toggleShortcuts: () => {
        set(state => ({ 
          shortcutsEnabled: !state.shortcutsEnabled 
        }));
      },
      
      toggleCommandPalette: () => {
        set(state => ({ 
          commandPaletteOpen: !state.commandPaletteOpen 
        }));
      },
      
      // Tour Actions
      startTour: () => {
        set({ 
          tourActive: true, 
          tourStep: 0 
        });
      },
      
      nextTourStep: () => {
        set(state => ({ 
          tourStep: state.tourStep + 1 
        }));
      },
      
      skipTour: () => {
        set({ 
          tourActive: false, 
          tourStep: 0 
        });
      },
      
      completeTour: () => {
        set({ 
          tourActive: false, 
          tourStep: 0, 
          hasCompletedTour: true 
        });
      },
      
      // Utility
      reset: () => {
        set({
          taskModal: { isOpen: false },
          bulkUploadModal: false,
          analyticsModal: false,
          dependencyModal: { isOpen: false },
          settingsModal: false,
          toasts: [],
          globalLoading: false,
          loadingMessage: undefined,
          isDragging: false,
          draggedTaskId: undefined,
          dropTargetCategory: undefined,
          commandPaletteOpen: false
        });
      }
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        viewMode: state.viewMode,
        compactMode: state.compactMode,
        shortcutsEnabled: state.shortcutsEnabled,
        hasCompletedTour: state.hasCompletedTour
      })
    }
  )
);