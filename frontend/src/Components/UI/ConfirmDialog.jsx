import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, busy = false }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-surface-container-lowest w-full max-w-md rounded-lg shadow-lift overflow-hidden transform scale-100 opacity-100 transition-all"
      >
        <div className="p-6">
          <h2 id="dialog-title" className="font-display text-2xl text-primary mb-2">
            {title}
          </h2>
          <p className="font-body text-on-surface-variant">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 bg-surface-container-low flex justify-end gap-3 border-t border-outline-variant/30">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 font-body font-medium text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`px-6 py-2 rounded text-white font-body font-medium transition-colors shadow-sm disabled:opacity-50 ${
              danger 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
