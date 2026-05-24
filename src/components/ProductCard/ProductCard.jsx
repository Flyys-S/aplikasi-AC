import React from 'react';
import './ProductCard.css';

const ProductCard = ({ 
  image, 
  title, 
  specs, 
  price, 
  status, 
  onClick 
}) => {
  return (
    <div className="product-card card-elevation" onClick={onClick}>
      <div className="product-image-container">
        {status && <span className="product-badge">{status}</span>}
        {image ? (
          <img src={image} alt={title} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-title">{title}</h3>
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

