import React, { useEffect, useRef } from 'react';

export default function Notice({ type = 'info', message, onDismiss, actionLabel, onAction, autoFocusAction }) {
  const actionRef = useRef(null);
  
  useEffect(() => {
    if (autoFocusAction && actionRef.current) {
      actionRef.current.focus();
    }
  }, [autoFocusAction]);
  
  const typeStyles = {
    info: 'bg-surface-container-low text-on-surface border-l-4 border-primary',
    success: 'bg-green-50 text-green-900 border-l-4 border-green-600',
    warning: 'bg-yellow-50 text-yellow-900 border-l-4 border-yellow-600',
    error: 'bg-red-50 text-red-900 border-l-4 border-red-600',
  };

  return (
    <div className={`p-4 rounded shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${typeStyles[type] || typeStyles.info}`} role="alert">
      <div className="flex-1 font-body text-sm font-medium">{message}</div>
      
      <div className="flex items-center gap-4 shrink-0">
        {onAction && actionLabel && (
          <button
            ref={actionRef}
            onClick={onAction}
            className="text-sm font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="text-xl leading-none opacity-60 hover:opacity-100 transition-opacity p-1"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
