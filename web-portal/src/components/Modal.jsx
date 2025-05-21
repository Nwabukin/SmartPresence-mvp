import React from 'react';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) {
    return null;
  }
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 5, minWidth: 300, boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} style={{ marginTop: 15, padding: '8px 15px', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};

export default Modal; 