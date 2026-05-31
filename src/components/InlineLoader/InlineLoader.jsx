import React from 'react';

/**
 * Dipakai di dalam halaman (bukan full-page)
 */
const InlineLoader = ({ text = 'Memuat data...' }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
    <div className="mms-loader-wrapper">
      <div className="mms-spinner-ring" style={{ width: '36px', height: '36px' }}></div>
      {text && <p className="mms-loader-text" style={{ fontSize: '13px', marginTop: '12px' }}>{text}</p>}
    </div>
  </div>
);

export default InlineLoader;

