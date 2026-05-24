import React from 'react';

const EmptyState = ({ icon: Icon, text, subtext }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
    {Icon && <Icon size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />}
    <p style={{ fontSize: '15px', fontWeight: '500', color: '#666' }}>{text}</p>
    {subtext && <p style={{ fontSize: '13px', marginTop: '4px' }}>{subtext}</p>}
  </div>
);

export default EmptyState;

