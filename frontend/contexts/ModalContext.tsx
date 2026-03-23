import React, { createContext, useContext, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ModalOptions {
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onConfirm?: () => void;
  confirmLabel?: string;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showModal = (options: ModalOptions) => setModal(options);
  const hideModal = () => setModal(null);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal && (
        <ConfirmDialog
          {...modal}
          isOpen={!!modal}
          onClose={hideModal}
        />
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
