import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import ProductCard from '../components/ProductCard';
import './SalesDashboard.css';
import './Inventory.css';

const Inventory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const products = [
    { id: 1, title: 'Daikin Inverter 1 PK FTKC25TV', price: 'Rp 5.200.000', stock: 12, status: 'Tersedia' },
    { id: 2, title: 'Panasonic Standard 1/2 PK CS/CU-ZN5WKP', price: 'Rp 3.100.000', stock: 5, status: 'Menipis' },
    { id: 3, title: 'Sharp Plasmacluster 1 PK AH-XP10UHY', price: 'Rp 4.500.000', stock: 0, status: 'Habis' },
    { id: 4, title: 'LG Dual Inverter 1.5 PK T15EV4', price: 'Rp 6.800.000', stock: 8, status: 'Tersedia' },
  ];

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <div>
          <h2>Inventori</h2>
          <p>Kelola Stok Produk AC</p>
        </div>
        <div className="header-actions">
          <div className="icon-btn" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            <Plus size={20} />
          </div>
        </div>
      </header>

      <div className="page-content">
        <div className="search-filter-bar">
          <div className="search-input-wrapper card-elevation">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-btn card-elevation">
            <Filter size={18} />
          </div>
        </div>

        <div className="inventory-grid">
          {products.map(product => (
            <ProductCard 
              key={product.id}
              title={product.title}
              price={product.price}
              specs={[`Stok: ${product.stock} unit`, product.status]}
              status={product.status}
              onClick={() => navigate(`/inventory/${product.id}`)}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inventory;
