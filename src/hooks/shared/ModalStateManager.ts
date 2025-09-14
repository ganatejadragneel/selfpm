// Shared Modal State Management - Phase 7B DRY Refactoring
// INTERNAL UTILITY - Common modal patterns

import { useState, useCallback } from 'react';

// Generic modal state management
export const createModalState = <T = any>(initialData?: T) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialData || null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeAndClear = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    closeAndClear,
    toggle,
    setData
  };
};

// Multi-modal state manager for complex modal interactions
export const createMultiModalState = <T extends Record<string, any>>() => {
  const [states, setStates] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [data, setData] = useState<Partial<T>>({});

  const open = useCallback(<K extends keyof T>(modalKey: K, modalData?: T[K]) => {
    setStates(prev => ({ ...prev, [modalKey]: true }));
    if (modalData !== undefined) {
      setData(prev => ({ ...prev, [modalKey]: modalData }));
    }
  }, []);

  const close = useCallback(<K extends keyof T>(modalKey: K) => {
    setStates(prev => ({ ...prev, [modalKey]: false }));
  }, []);

  const closeAll = useCallback(() => {
    setStates({} as Record<keyof T, boolean>);
  }, []);

  const isOpen = useCallback(<K extends keyof T>(modalKey: K): boolean => {
    return states[modalKey] || false;
  }, [states]);

  const getData = useCallback(<K extends keyof T>(modalKey: K): T[K] | undefined => {
    return data[modalKey];
  }, [data]);

  return {
    open,
    close,
    closeAll,
    isOpen,
    getData,
    setData: (modalKey: keyof T, modalData: T[typeof modalKey]) => {
      setData(prev => ({ ...prev, [modalKey]: modalData }));
    }
  };
};

// Common modal configuration patterns
export interface ModalConfig {
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  focusTrap?: boolean;
}

export const defaultModalConfig: ModalConfig = {
  closeOnOverlayClick: true,
  closeOnEscape: true,
  preventScroll: true,
  focusTrap: true
};

// Modal event handlers for common scenarios
export const createModalHandlers = (
  onClose: () => void,
  config: ModalConfig = defaultModalConfig
) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (config.closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose, config.closeOnOverlayClick]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (config.closeOnEscape && e.key === 'Escape') {
      onClose();
    }
  }, [onClose, config.closeOnEscape]);

  return {
    handleOverlayClick,
    handleKeyDown
  };
};