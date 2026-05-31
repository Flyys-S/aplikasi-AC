import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false, 
  disabled = false,
  onClick, 
  type = 'button',
  className = '',
  style,
  icon: Icon
}) => {
  return (
    <button 
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${disabled ? 'btn-disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {Icon && <Icon className={`btn-icon ${disabled ? 'spinner' : ''}`} size={size === 'small' ? 14 : 18} />}
      {children}
    </button>
  );
};

export default Button;
