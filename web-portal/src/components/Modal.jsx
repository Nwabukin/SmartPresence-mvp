import React, { useEffect, useRef } from 'react';

const Modal = ({ show = true, onClose, title, children }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onDocKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', onDocKeyDown, { capture: true });
    if (dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable && typeof firstFocusable.focus === 'function') {
        firstFocusable.focus();
      }
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onDocKeyDown, { capture: true });
    };
  }, [show]);

  if (show === false) {
    return null;
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 5,
          minWidth: 300,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); }}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onMouseUp={(e) => { e.stopPropagation(); }}
        onKeyDown={(e) => { e.stopPropagation(); }}
      >
        <h2>{title}</h2>
        {children}
        <button
          onClick={onClose}
          style={{ marginTop: 15, padding: '8px 15px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
