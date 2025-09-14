import { useState, useCallback } from 'react';
import type { Task, TaskCategory } from '../types';

export interface UseModalOperationsReturn {
  // Task Modal
  selectedTask: Task | null;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  
  // Add Task Modal
  showAddTask: boolean;
  addTaskCategory: TaskCategory;
  openAddTaskModal: (category: TaskCategory) => void;
  closeAddTaskModal: () => void;
  
  // Bulk Upload Modal
  showBulkUpload: boolean;
  openBulkUploadModal: () => void;
  closeBulkUploadModal: () => void;
  
  // Activity Tracker Modal
  showActivityTracker: boolean;
  openActivityTrackerModal: () => void;
  closeActivityTrackerModal: () => void;
  
  // Daily Analytics Modal
  showDailyAnalytics: boolean;
  openDailyAnalyticsModal: () => void;
  closeDailyAnalyticsModal: () => void;
  
  // Utility
  closeAllModals: () => void;
}

export const useModalOperations = (): UseModalOperationsReturn => {
  // Task Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Add Task Modal State
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskCategory, setAddTaskCategory] = useState<TaskCategory>('life_admin');
  
  // Other Modals State
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showActivityTracker, setShowActivityTracker] = useState(false);
  const [showDailyAnalytics, setShowDailyAnalytics] = useState(false);

  // Task Modal Operations
  const openTaskModal = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const closeTaskModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  // Add Task Modal Operations
  const openAddTaskModal = useCallback((category: TaskCategory) => {
    setAddTaskCategory(category);
    setShowAddTask(true);
  }, []);

  const closeAddTaskModal = useCallback(() => {
    setShowAddTask(false);
  }, []);

  // Bulk Upload Modal Operations
  const openBulkUploadModal = useCallback(() => {
    setShowBulkUpload(true);
  }, []);

  const closeBulkUploadModal = useCallback(() => {
    setShowBulkUpload(false);
  }, []);

  // Activity Tracker Modal Operations
  const openActivityTrackerModal = useCallback(() => {
    setShowActivityTracker(true);
  }, []);

  const closeActivityTrackerModal = useCallback(() => {
    setShowActivityTracker(false);
  }, []);

  // Daily Analytics Modal Operations
  const openDailyAnalyticsModal = useCallback(() => {
    setShowDailyAnalytics(true);
  }, []);

  const closeDailyAnalyticsModal = useCallback(() => {
    setShowDailyAnalytics(false);
  }, []);

  // Utility Operations
  const closeAllModals = useCallback(() => {
    setSelectedTask(null);
    setShowAddTask(false);
    setShowBulkUpload(false);
    setShowActivityTracker(false);
    setShowDailyAnalytics(false);
  }, []);

  return {
    // Task Modal
    selectedTask,
    openTaskModal,
    closeTaskModal,
    
    // Add Task Modal
    showAddTask,
    addTaskCategory,
    openAddTaskModal,
    closeAddTaskModal,
    
    // Bulk Upload Modal
    showBulkUpload,
    openBulkUploadModal,
    closeBulkUploadModal,
    
    // Activity Tracker Modal
    showActivityTracker,
    openActivityTrackerModal,
    closeActivityTrackerModal,
    
    // Daily Analytics Modal
    showDailyAnalytics,
    openDailyAnalyticsModal,
    closeDailyAnalyticsModal,
    
    // Utility
    closeAllModals,
  };
};