import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useModalOperations } from '../hooks/useModalOperations';
import type { UseModalOperationsReturn } from '../hooks/useModalOperations';

const ModalContext = createContext<UseModalOperationsReturn | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const modalOperations = useModalOperations();

  return (
    <ModalContext.Provider value={modalOperations}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};