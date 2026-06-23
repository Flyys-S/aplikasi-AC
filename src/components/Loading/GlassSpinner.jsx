import React from 'react';
import './Loading.css';

const GlassSpinner = ({ message = 'Memuat...' }) => {
  return (
    <div className="glass-loading-overlay">
      <div className="glass-loading-card glass-panel">
        <div className="custom-spinner" />
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
};

export default GlassSpinner;
