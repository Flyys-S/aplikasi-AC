import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Dipakai di dalam halaman (bukan full-page)
 */
const InlineLoader = ({ text = 'Memuat data...' }) => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <Loader2 className="spinner" size={32} color="var(--color-primary)" />
    {text && <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>{text}</p>}
  </div>
);

export default InlineLoader;

