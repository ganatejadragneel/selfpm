import { useState, useCallback } from 'react';
import type { Task, TaskCategory } from '../types';

export interface ModalState {
  selectedTask: Task | null;
  showQuickAdd: boolean;
  quickAddCategory: TaskCategory;
  showBulkUpload: boolean;
  showActivityTracker: boolean;
  showDailyTaskAnalytics: boolean;
}

export const useModalState = () => {
  const [modalState, setModalState] = useState<ModalState>({
    selectedTask: null,
    showQuickAdd: false,
    quickAddCategory: 'life_admin',
    showBulkUpload: false,
    showActivityTracker: false,
    showDailyTaskAnalytics: false,
  });

  const openTask = useCallback((task: Task) => {
    setModalState(prev => ({ ...prev, selectedTask: task }));
  }, []);

  const closeTask = useCallback(() => {
    setModalState(prev => ({ ...prev, selectedTask: null }));
  }, []);

  const openQuickAdd = useCallback((category: TaskCategory = 'life_admin') => {
    setModalState(prev => ({ 
      ...prev, 
      showQuickAdd: true, 
      quickAddCategory: category 
    }));
  }, []);

  const closeQuickAdd = useCallback(() => {
    setModalState(prev => ({ ...prev, showQuickAdd: false }));
  }, []);


  const openBulkUpload = useCallback(() => {
    setModalState(prev => ({ ...prev, showBulkUpload: true }));
  }, []);

  const closeBulkUpload = useCallback(() => {
    setModalState(prev => ({ ...prev, showBulkUpload: false }));
  }, []);

  const openActivityTracker = useCallback(() => {
    setModalState(prev => ({ ...prev, showActivityTracker: true }));
  }, []);

  const closeActivityTracker = useCallback(() => {
    setModalState(prev => ({ ...prev, showActivityTracker: false }));
  }, []);

  const openDailyTaskAnalytics = useCallback(() => {
    setModalState(prev => ({ ...prev, showDailyTaskAnalytics: true }));
  }, []);

  const closeDailyTaskAnalytics = useCallback(() => {
    setModalState(prev => ({ ...prev, showDailyTaskAnalytics: false }));
  }, []);

  return {
    modalState,
    actions: {
      openTask,
      closeTask,
      openQuickAdd,
      closeQuickAdd,
      openBulkUpload,
      closeBulkUpload,
      openActivityTracker,
      closeActivityTracker,
      openDailyTaskAnalytics,
      closeDailyTaskAnalytics,
    },
  };
};