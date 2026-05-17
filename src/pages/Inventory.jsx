import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../lib/formatters';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import ProductCard from '../components/ProductCard';
import './SalesDashboard.css';
import './Inventory.css';

const Inventory = () => {
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
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (stock) => {
    if (stock <= 0) return 'Habis';
    if (stock <= 5) return 'Menipis';
    return 'Tersedia';
  };

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Inventori" subtitle="Kelola Stok Produk AC">
        <div 
          className="icon-btn" 
          style={{ backgroundColor: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
          onClick={() => navigate('/inventory/new')}
        >
          <Plus size={20} />
        </div>
      </TopHeader>

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

        {loading ? (
          <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={32} />
            <p style={{ marginTop: '12px', color: '#666' }}>Memuat data produk...</p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  image={product.image_url}
                  title={`${product.brand} ${product.name}`}
                  price={formatRupiah(product.price)}
                  specs={[`Stok: ${product.stock} unit`, `${product.capacity_pk} PK`]}
                  status={getStatusLabel(product.stock)}
                  onClick={() => navigate(`/inventory/${product.id}`)}
                />
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                <p>Tidak ada produk yang ditemukan.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Inventory;
