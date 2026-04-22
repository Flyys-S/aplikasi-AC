import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  onClick, 
  type = 'button',
  className = '',
  icon: Icon
}) => {
  return (
    <button 
      type={type}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon className="btn-icon" size={18} />}
      {children}
    </button>
  );
};

export default Button;
