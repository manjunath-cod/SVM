import React, { useEffect } from 'react';
import { Icon } from './Icons.jsx';

export function Modal({ isOpen, onClose, title, eyebrow, children, maxWidth = 540 }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <button
          className="icon-button modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" size={18} />
        </button>

        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2 id="modal-title">{title}</h2>}
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

