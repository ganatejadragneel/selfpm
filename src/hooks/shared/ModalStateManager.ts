// Shared Modal State Management - Phase 7B DRY Refactoring
// INTERNAL UTILITY - Common modal patterns

import { useState, useCallback, useRef } from 'react';

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
// Phase 4: Advanced Modal System Enhancements
// Built on top of existing ModalStateManager without breaking compatibility

// Modal lifecycle events interface
export interface ModalLifecycleEvents<T = any> {
  onBeforeOpen?: (data?: T) => boolean | Promise<boolean>; // Return false to prevent opening
  onAfterOpen?: (data?: T) => void;
  onBeforeClose?: (data?: T) => boolean | Promise<boolean>; // Return false to prevent closing
  onAfterClose?: (data?: T) => void;
  onDataChange?: (newData: T, oldData?: T) => void;
}

// Enhanced modal configuration with lifecycle events
export interface AdvancedModalConfig<T = any> extends ModalConfig {
  lifecycle?: ModalLifecycleEvents<T>;
  autoFocus?: string; // CSS selector for element to focus
  returnFocus?: boolean; // Return focus to trigger element
  zIndex?: number;
  maxWidth?: string;
  maxHeight?: string;
  centered?: boolean;
  backdrop?: 'static' | 'blur' | 'dark' | 'none';
}

// Advanced modal state with lifecycle management
export const createAdvancedModalState = <T = any>(
  initialData?: T,
  config: AdvancedModalConfig<T> = {}
) => {
  const baseModal = createModalState(initialData);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const modalElementRef = useRef<HTMLElement | null>(null);

  // Store original focus element
  const storeFocusedElement = useCallback(() => {
    triggerElementRef.current = document.activeElement as HTMLElement;
  }, []);

  // Restore focus to trigger element
  const restoreFocus = useCallback(() => {
    if (config.returnFocus !== false && triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [config.returnFocus]);

  // Focus management
  const manageFocus = useCallback(() => {
    if (config.autoFocus) {
      const focusElement = modalElementRef.current?.querySelector(config.autoFocus) as HTMLElement;
      if (focusElement) {
        focusElement.focus();
      }
    } else if (modalElementRef.current) {
      // Focus first interactive element
      const focusableElements = modalElementRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [config.autoFocus]);

  // Enhanced open with lifecycle hooks
  const open = useCallback(async (modalData?: T) => {
    // Before open lifecycle
    if (config.lifecycle?.onBeforeOpen) {
      const shouldOpen = await config.lifecycle.onBeforeOpen(modalData);
      if (shouldOpen === false) return;
    }

    storeFocusedElement();
    baseModal.open(modalData);

    // After open lifecycle
    setTimeout(() => {
      manageFocus();
      if (config.lifecycle?.onAfterOpen) {
        config.lifecycle.onAfterOpen(modalData);
      }
    }, 10); // Small delay for DOM updates
  }, [baseModal.open, config.lifecycle, storeFocusedElement, manageFocus]);

  // Enhanced close with lifecycle hooks
  const close = useCallback(async () => {
    // Before close lifecycle
    if (config.lifecycle?.onBeforeClose) {
      const shouldClose = await config.lifecycle.onBeforeClose(baseModal.data || undefined);
      if (shouldClose === false) return;
    }

    baseModal.close();
    restoreFocus();

    // After close lifecycle
    if (config.lifecycle?.onAfterClose) {
      config.lifecycle.onAfterClose(baseModal.data || undefined);
    }
  }, [baseModal.close, baseModal.data, config.lifecycle, restoreFocus]);

  // Enhanced setData with change tracking
  const setData = useCallback((newData: T) => {
    const oldData = baseModal.data;
    baseModal.setData(newData);

    if (config.lifecycle?.onDataChange && oldData !== newData) {
      config.lifecycle.onDataChange(newData, oldData || undefined);
    }
  }, [baseModal.setData, baseModal.data, config.lifecycle]);

  return {
    ...baseModal,
    open,
    close,
    setData,
    modalElementRef,
    config,
  };
};

// Modal stack manager for handling multiple modals
export const createModalStack = () => {
  const [stack, setStack] = useState<string[]>([]);
  const modals = useRef<Map<string, { close: () => void; zIndex: number }>>(new Map());

  const register = useCallback((id: string, modal: { close: () => void; zIndex?: number }) => {
    modals.current.set(id, { ...modal, zIndex: modal.zIndex || 1000 });
  }, []);

  const unregister = useCallback((id: string) => {
    modals.current.delete(id);
    setStack(prev => prev.filter(modalId => modalId !== id));
  }, []);

  const push = useCallback((id: string) => {
    setStack(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const pop = useCallback(() => {
    setStack(prev => {
      const newStack = [...prev];
      const removed = newStack.pop();
      if (removed && modals.current.has(removed)) {
        modals.current.get(removed)?.close();
      }
      return newStack;
    });
  }, []);

  const closeAll = useCallback(() => {
    stack.forEach(id => {
      if (modals.current.has(id)) {
        modals.current.get(id)?.close();
      }
    });
    setStack([]);
  }, [stack]);

  const getTopModal = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const getZIndex = useCallback((id: string) => {
    const baseZIndex = modals.current.get(id)?.zIndex || 1000;
    const stackIndex = stack.indexOf(id);
    return stackIndex >= 0 ? baseZIndex + stackIndex : baseZIndex;
  }, [stack]);

  return {
    stack,
    register,
    unregister,
    push,
    pop,
    closeAll,
    getTopModal,
    getZIndex,
  };
};

// Modal context provider for cross-modal communication
export const createModalContext = () => {
  const [globalData, setGlobalData] = useState<Record<string, any>>({});
  const [modalStack] = useState(() => createModalStack());

  const shareData = useCallback((key: string, data: any) => {
    setGlobalData(prev => ({ ...prev, [key]: data }));
  }, []);

  const getData = useCallback((key: string) => {
    return globalData[key];
  }, [globalData]);

  const clearData = useCallback((key?: string) => {
    if (key) {
      setGlobalData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } else {
      setGlobalData({});
    }
  }, []);

  return {
    shareData,
    getData,
    clearData,
    modalStack,
  };
};

// Modal animation coordinator
export const createModalAnimations = (config?: { duration?: number; easing?: string }) => {
  const duration = config?.duration || 200;
  const easing = config?.easing || 'ease-out';

  const fadeIn = useCallback((element: HTMLElement) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ${easing}`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }, [duration, easing]);

  const fadeOut = useCallback((element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms ${easing}`;
      element.style.opacity = '0';
      
      setTimeout(resolve, duration);
    });
  }, [duration, easing]);

  const slideIn = useCallback((element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)',
    };

    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
    
    requestAnimationFrame(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    });
  }, [duration, easing]);

  const scaleIn = useCallback((element: HTMLElement) => {
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
    
    requestAnimationFrame(() => {
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    });
  }, [duration, easing]);

  return {
    fadeIn,
    fadeOut,
    slideIn,
    scaleIn,
  };
};
