import React from 'react';
import './InputField.css';

const InputField = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  icon: Icon,
  error 
}) => {
  return (
    <div className="input-group fade-in">
      {label && <label className="input-label">{label}</label>}
      <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
        {Icon && <Icon className="input-icon" size={20} />}
        <input 
          type={type}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};

export default InputField;

