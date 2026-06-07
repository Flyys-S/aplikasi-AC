import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
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
  // Parse numeric price for discount calculation
  const numericPrice = typeof price === 'string' 
    ? parseInt(price.replace(/[^0-9]/g, ''), 10) 
    : price;

  const originalPriceFormatted = numericPrice 
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Math.round(numericPrice * 1.12)) // simulate a 12% discount
    : '';

  // Generate consistent rating and review count based on name length for realism
  const ratingScore = 5;
  const reviewCount = name ? (name.length * 3) + 5 : 12;

  const isMulti = type?.toLowerCase().includes('multi') || name?.toLowerCase().includes('multi');
  const connectionLabel = isMulti ? '2 Koneksi' : '1 Koneksi';

  return (
    <div className="product-card card-elevation" onClick={onClick}>
      <div className="product-image-container">
        {image ? (
          <img src={image} alt={`${brand} ${name}`} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* Blue Category/Type Banner */}
      <div className="product-category-banner">
        <span className="banner-logo">❄️ {brand?.toUpperCase()}</span>
        <span className="banner-text">{type?.toUpperCase() || 'STANDARD SPLIT'}</span>
      </div>

      <div className="product-info">
        {/* Title */}
        <h3 className="product-title" title={`${brand} ${name}`}>
          {brand?.toUpperCase()} AC {name?.toUpperCase()}
        </h3>

        {/* Promo Badges */}
        <div className="product-promo-badges">
          <span className="badge-promo-xtra">PROMO XTRA+</span>
          <span className="badge-gratis-ongkir">GRATIS ONGKIR</span>
        </div>

        {/* Specs and Connections */}
        <div className="product-specs-row">
          <span className="badge-connection">⚙️ {connectionLabel}</span>
          {specs && specs[0] && <span className="badge-pk">{specs[0]}</span>}
        </div>

        {/* Price Section */}
        <div className="product-price-section">
          <span className="product-price-box">{price}</span>
          {originalPriceFormatted && (
            <span className="product-price-original">{originalPriceFormatted}</span>
          )}
        </div>

        {/* Rating and Review Row */}
        <div className="product-rating-row">
          <div className="stars-wrapper">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} fill="#facc15" color="#facc15" />
            ))}
            <span className="rating-score">({ratingScore})</span>
          </div>
          <span className="divider">•</span>
          <div className="reviews-wrapper">
            <MessageSquare size={11} className="review-icon" />
            <span className="review-count">{reviewCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
