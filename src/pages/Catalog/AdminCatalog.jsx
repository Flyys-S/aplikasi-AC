import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Package, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Navigation from '../../components/Navigation';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import '../Inventory/Inventory.css';
import './Catalog.css';

const AdminCatalog = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pkFilter, setPkFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const fetchProducts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPK = pkFilter ? String(product.capacity_pk) === pkFilter : true;
    const matchesBrand = brandFilter ? product.brand.toLowerCase() === brandFilter.toLowerCase() : true;
    return matchesSearch && matchesPK && matchesBrand;
  });

  return (
    <div className="dashboard-container">
      <TopHeader title="Katalog Produk" subtitle="Daftar produk AC terlengkap untuk manajemen admin" />
      
      <div className="page-content fade-in">
        {/* Brand Filter List */}
        <section className="selka-brand-filters" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter Merk AC</h4>
            {(brandFilter || pkFilter) && (
              <Button size="small" variant="outline" onClick={() => { setBrandFilter(''); setPkFilter(''); }}>
                Bersihkan Filter
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {['Daikin', 'Panasonic', 'Gree', 'Sharp', 'Mitsubishi'].map(brandName => (
              <div 
                key={brandName}
                onClick={() => setBrandFilter(brandFilter.toLowerCase() === brandName.toLowerCase() ? '' : brandName.toLowerCase())}
                style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: `2px solid ${brandFilter.toLowerCase() === brandName.toLowerCase() ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: brandFilter.toLowerCase() === brandName.toLowerCase() ? 'rgba(0, 85, 255, 0.05)' : 'var(--color-surface-container-lowest)',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-diffused)'
                }}
                className="brand-filter-btn"
              >
                {brandName}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['0.5', '0.75', '1', '1.5', '2'].map(pk => (
              <button
                key={pk}
                onClick={() => setPkFilter(pkFilter === pk ? '' : pk)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid var(--color-outline-variant)',
                  background: pkFilter === pk ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                  color: pkFilter === pk ? 'white' : 'var(--color-on-surface)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {pk} PK
              </button>
            ))}
          </div>
        </section>

        {/* Search Bar */}
        <div className="search-filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-input-wrapper card-elevation" style={{ width: '100%', maxWidth: '400px' }}>
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
          <InlineLoader text="Memuat katalog..." />
        ) : (
          <div className="inventory-grid" style={{ paddingBottom: '32px', width: '100%' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} style={{ position: 'relative' }}>
                  <ProductCard
                    image={product.image_url}
                    title={`${product.brand} ${product.name}`}
                    price={formatRupiah(product.price)}
                    specs={[`${product.capacity_pk} PK`, product.stock > 0 ? 'Ready Stock' : 'Indent']}
                    status={product.stock > 0 ? 'Tersedia' : 'Habis'}
                    onClick={() => navigate(`/inventory/${product.id}`)}
                  />
                </div>
              ))
            ) : (
              <EmptyState icon={Package} text="Produk tidak ditemukan di katalog." />
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default AdminCatalog;
