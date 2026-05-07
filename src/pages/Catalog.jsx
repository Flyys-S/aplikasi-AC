import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Info, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import ProductCard from '../components/ProductCard';
import './Inventory.css'; // Reuse grid styles

const Catalog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('brand', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching catalog:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Katalog Produk" subtitle="Brosur Digital AC Arctic Clarity">
        <div className="icon-btn" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
          <ShoppingCart size={20} />
        </div>
      </TopHeader>

      <div className="page-content">
        <div className="search-filter-bar">
          <div className="search-input-wrapper card-elevation">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari merk atau tipe AC..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={32} />
            <p style={{ marginTop: '12px', color: '#666' }}>Membuka katalog...</p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  image={product.image_url}
                  title={`${product.brand} ${product.name}`}
                  price={formatPrice(product.price)}
                  specs={[`${product.capacity_pk} PK`, product.stock > 0 ? 'Ready Stock' : 'Indent']}
                  status={product.stock > 0 ? 'Tersedia' : 'Habis'}
                  onClick={() => navigate(`/inventory/${product.id}`)}
                />
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                <p>Produk tidak ditemukan di katalog.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Catalog;
