import React from 'react';
import './Loading.css';

const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="skeleton-table-container glass-panel">
      <div className="skeleton-header-shimmer" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="skeleton-row">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;
