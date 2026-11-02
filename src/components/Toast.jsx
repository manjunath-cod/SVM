import React from 'react';
import { Icon } from './Icons.jsx';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast-banner ${isError ? 'toast-error' : isSuccess ? 'toast-success' : 'toast-info'}`}>
      <div className="toast-icon">
        <Icon name={isError ? 'alert' : isSuccess ? 'check' : 'info'} size={18} />
      </div>
      <div className="toast-content">
        {toast.title && <strong>{toast.title}</strong>}
        <p>{toast.message}</p>
      </div>
      {onClose && (
        <button className="icon-button toast-close" onClick={onClose} aria-label="Dismiss message">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}

