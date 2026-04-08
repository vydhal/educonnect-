import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onConfirm?: () => void;
  confirmLabel?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm, 
  confirmLabel = 'OK' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return 'error';
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'error': return 'text-red-500 bg-red-50';
      case 'success': return 'text-emerald-500 bg-emerald-50';
      case 'warning': return 'text-orange-500 bg-orange-50';
      default: return 'text-primary bg-primary/5';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'error': return 'bg-red-500 hover:bg-red-600 shadow-red-200';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200';
      case 'warning': return 'bg-orange-500 hover:bg-orange-600 shadow-orange-200';
      default: return 'bg-primary hover:bg-primary/90 shadow-primary/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-[32px] md:rounded-[24px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`size-14 md:size-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 ${getColor()}`}>
              <span className="material-symbols-outlined text-3xl md:text-4xl">{getIcon()}</span>
            </div>
            
            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
              {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        <div className="p-4 pb-8 md:pb-4 bg-gray-50/50 dark:bg-black/20 border-t dark:border-white/5 flex flex-col md:flex-row gap-2 md:gap-3">
          {onConfirm && (
            <button 
              onClick={onClose}
              className="px-4 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${getButtonColor()}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
