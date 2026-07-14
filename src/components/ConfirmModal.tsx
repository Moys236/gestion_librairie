'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  id: string;
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  formId?: string;
}

export default function ConfirmModal({
  id,
  title,
  message,
  warning,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  formId
}: ConfirmModalProps) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!(window as any).openModal) {
        (window as any).openModal = function(modalId: string) {
          document.getElementById(modalId)?.classList.remove('hidden');
        };
      }
      if (!(window as any).closeModal) {
        (window as any).closeModal = function(modalId: string) {
          document.getElementById(modalId)?.classList.add('hidden');
        };
      }
    }
  }, []);

  const handleClose = () => {
    document.getElementById(id)?.classList.add('hidden');
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (form) {
        form.submit();
      }
    }
    handleClose();
  };

  return (
    <div 
      id={id} 
      className="modal-backdrop hidden fixed inset-0 bg-black-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="card max-w-md w-full bg-white rounded-lg shadow-lg">
        <h3 className="h3 mb-2">{title}</h3>
        <p className="text-text mb-4 text-base">{message}</p>
        
        {warning && (
          <div className="badge badge-warning p-3 w-full mb-6 block text-right leading-relaxed" style={{ display: 'block', fontSize: '13px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
            <strong className="text-accent">ملاحظة هامة:</strong> {warning}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border">
          <button type="button" className="btn btn-outline" onClick={handleClose}>{cancelText}</button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
