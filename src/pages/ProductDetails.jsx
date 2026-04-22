import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Thermometer, Zap, Star, ShoppingCart, Share2 } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import './ProductDetails.css';

const ProductDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="product-detail-container fade-in">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>
        <h2>Detail Produk</h2>
        <button className="back-btn">
          <Share2 size={20} />
        </button>
      </header>

      <div className="product-hero">
        <div className="product-hero-image">
          <div className="hero-placeholder">
            <Thermometer size={64} strokeWidth={1} color="var(--color-primary)" />
            <span>AC Unit</span>
          </div>
        </div>
      </div>

      <div className="product-detail-body">
        <div className="product-detail-header">
          <StatusChip status="In Stock" type="success" />
          <div className="rating-row">
            <Star size={14} fill="#F5A623" stroke="#F5A623" />
            <span>4.8 (240 ulasan)</span>
          </div>
        </div>

        <h1 className="product-detail-title">Daikin Inverter 1 PK FTKC25TV</h1>
        <p className="product-detail-price">Rp 5.200.000</p>

        <div className="spec-grid">
          <div className="spec-item card-elevation">
            <Thermometer size={20} className="spec-icon-main" />
            <span className="spec-label">Kapasitas</span>
            <span className="spec-value">1 PK / 9.000 BTU</span>
          </div>
          <div className="spec-item card-elevation">
            <Zap size={20} className="spec-icon-main" />
            <span className="spec-label">Daya</span>
            <span className="spec-value">780 Watt</span>
          </div>
          <div className="spec-item card-elevation">
            <Star size={20} className="spec-icon-main" />
            <span className="spec-label">Rating Energi</span>
            <span className="spec-value">5 Bintang</span>
          </div>
          <div className="spec-item card-elevation">
            <Zap size={20} className="spec-icon-main" />
            <span className="spec-label">Teknologi</span>
            <span className="spec-value">Inverter</span>
          </div>
        </div>

        <div className="product-description card-elevation">
          <h3>Deskripsi</h3>
          <p>
            Daikin Inverter Series menghadirkan kenyamanan optimal dengan teknologi inverter terdepan. 
            Hemat energi hingga 50% dibanding AC konvensional, dilengkapi fitur self-cleaning otomatis 
            dan filter anti-bakteri. Cocok untuk ruangan ukuran 10–14 m².
          </p>
        </div>

        <div className="detail-stock-info card-elevation">
          <span className="stock-label">Stok Tersedia</span>
          <span className="stock-count">12 Unit</span>
        </div>

        <div className="action-buttons">
          <Button variant="outline" icon={ShoppingCart}>
            Tambah ke Troli
          </Button>
          <Button icon={ShoppingCart} onClick={() => navigate('/service')}>
            Beli Sekarang
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProductDetails;
