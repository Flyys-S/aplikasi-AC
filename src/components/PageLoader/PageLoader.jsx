import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Dipakai untuk loading full-page (return awal komponen)
 */
const PageLoader = ({ text = 'Memuat...' }) => (
  <div
    className="dashboard-container fade-in"
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
  >
    <div style={{ textAlign: 'center' }}>
      <Loader2 className="spinner" size={32} color="var(--color-primary)" />
      {text && <p style={{ marginTop: '12px', color: '#999', fontSize: '14px' }}>{text}</p>}
    </div>
  </div>
);

export default PageLoader;

