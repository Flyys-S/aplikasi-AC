import React from 'react';

/**
 * Dipakai untuk loading full-page (return awal komponen)
 */
const PageLoader = ({ text = 'Memuat sistem...' }) => (
  <div
    className="dashboard-container fade-in"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--color-background)' }}
  >
    <div className="mms-loader-wrapper">
      <div className="mms-spinner-ring"></div>
      {text && <p className="mms-loader-text">{text}</p>}
    </div>
  </div>
);

export default PageLoader;

