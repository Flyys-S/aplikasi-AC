import React from 'react';
import './ProductCard.css';

const ProductCard = ({ 
  image, 
  brand, 
  name, 
  price, 
  type, 
  specs, 
  status, 
  onClick 
}) => {
  return (
    <div className="product-card card-elevation" onClick={onClick}>
      <div className="product-image-container">
        {status && <span className={`product-badge status-${status.toLowerCase()}`}>{status}</span>}
        {image ? (
          <img src={image} alt={`${brand} ${name}`} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="product-info">
        <div className="product-meta">
          <span className="product-brand">{brand}</span>
          {type && <span className="product-type-tag">{type}</span>}
        </div>
        <h3 className="product-title" title={`${brand} ${name}`}>{name}</h3>
        <div className="product-specs">
          {specs && specs.map((spec, idx) => (
            <span key={idx} className="spec-tag">{spec}</span>
          ))}
        </div>
        <div className="product-footer">
          <span className="product-price">{price}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
