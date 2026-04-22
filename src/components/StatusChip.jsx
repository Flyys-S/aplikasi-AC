import React from 'react';
import './StatusChip.css';

const StatusChip = ({ status, type = 'default' }) => {
  return (
    <span className={`status-chip status-${type}`}>
      {status}
    </span>
  );
};

export default StatusChip;
