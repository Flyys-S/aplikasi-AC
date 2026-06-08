import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Package, Sun, Moon, Sparkles, SlidersHorizontal, RefreshCw, HelpCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pkFilter, setPkFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // 'inverter', 'standard', etc.
  
  // PK Calculator State
  const [roomLength, setRoomLength] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [calcBtu, setCalcBtu] = useState(null);
  const [recommendedPK, setRecommendedPK] = useState('');
  const [isCalcOpen, setIsCalcOpen] = useState(false);

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
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Handle PK calculation
  const handleCalculatePK = () => {
    const l = parseFloat(roomLength);
    const w = parseFloat(roomWidth);
    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      setCalcBtu(null);
      setRecommendedPK('');
      return;
    }
    const btu = l * w * 500;
    setCalcBtu(btu);
    
    let recommendation = '0.5';
    if (btu <= 5000) recommendation = '0.5';
    else if (btu <= 7000) recommendation = '0.75';
    else if (btu <= 9000) recommendation = '1';
    else if (btu <= 12000) recommendation = '1.5';
    else if (btu <= 18000) recommendation = '2';
    else recommendation = '2.5';
    
    setRecommendedPK(recommendation);
    setPkFilter(recommendation); // Auto-apply to filter
  };

  const clearCalculator = () => {
    setRoomLength('');
    setRoomWidth('');
    setCalcBtu(null);
    setRecommendedPK('');
    setPkFilter('');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPK = pkFilter ? String(product.capacity_pk) === pkFilter : true;
    const matchesBrand = brandFilter ? product.brand.toLowerCase() === brandFilter.toLowerCase() : true;
    const matchesType = typeFilter ? product.name.toLowerCase().includes(typeFilter.toLowerCase()) : true;
    return matchesSearch && matchesPK && matchesBrand && matchesType;
  });

  return (
    <div className="dashboard-container" style={{ paddingLeft: '260px', transition: 'all 0.3s ease' }}>
      <TopHeader title="Katalog Produk" subtitle="Daftar produk AC terlengkap untuk manajemen admin" />
      
      <div className="page-content fade-in" style={{ padding: '24px' }}>
        
        {/* 🧮 Premium Row: Toolbar & Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap' 
        }}>
          <div className="search-input-wrapper card-elevation" style={{ flex: '1', minWidth: '280px', maxWidth: '440px', margin: 0 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Cari merk atau tipe AC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              variant="outline" 
              onClick={() => setIsCalcOpen(!isCalcOpen)} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '14px', height: '48px' }}
            >
              <Sparkles size={16} /> {isCalcOpen ? 'Tutup Kalkulator PK' : 'Kalkulator PK'}
            </Button>
            {(brandFilter || pkFilter || typeFilter) && (
              <Button 
                variant="outline" 
                onClick={() => { setBrandFilter(''); setPkFilter(''); setTypeFilter(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '14px', height: '48px', color: 'var(--color-error)' }}
              >
                <RefreshCw size={16} /> Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* 🧮 Interactive PK Calculator Widget */}
        {isCalcOpen && (
          <div className="pk-calculator-section card-elevation fade-in" style={{ 
            padding: '24px', 
            borderRadius: '24px', 
            marginBottom: '32px', 
            background: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-outline-variant)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--color-primary)" /> Estimasi PK AC & Kebutuhan Ruangan
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '20px' }}>
              Masukkan ukuran panjang dan lebar ruangan Anda untuk mengetahui rekomendasi PK AC yang tepat.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Panjang Ruangan (meter)</label>
                <input 
                  type="number" 
                  value={roomLength} 
                  onChange={(e) => setRoomLength(e.target.value)} 
                  placeholder="Contoh: 4" 
                  style={{ width: '100%', height: '44px', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Lebar Ruangan (meter)</label>
                <input 
                  type="number" 
                  value={roomWidth} 
                  onChange={(e) => setRoomWidth(e.target.value)} 
                  placeholder="Contoh: 3" 
                  style={{ width: '100%', height: '44px', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={handleCalculatePK} style={{ flex: '1', height: '44px', borderRadius: '12px' }}>Hitung PK</Button>
                <Button variant="outline" onClick={clearCalculator} style={{ height: '44px', borderRadius: '12px' }}>Clear</Button>
              </div>
            </div>

            {calcBtu !== null && (
              <div className="animate-slide-down" style={{ marginTop: '20px', padding: '16px', borderRadius: '16px', background: 'rgba(0, 85, 255, 0.06)', border: '1px solid rgba(0, 85, 255, 0.15)' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>Hasil Perhitungan:</div>
                <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--color-primary)' }}>
                  Kebutuhan Panas: {calcBtu} BTU/hr ➜ Rekomendasi AC: {recommendedPK} PK
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                  *Filter kapasitas PK telah diterapkan otomatis pada katalog di bawah.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📁 Filters Sidebar/Panel */}
        <div className="inv-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
          <aside className="inv-sidebar card-elevation glass-panel" style={{ padding: '20px', borderRadius: '24px', position: 'sticky', top: '24px', background: 'var(--color-surface-container-low)' }}>
            <div className="inv-sidebar-header" style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '16px' }}>
              <span className="inv-sidebar-title" style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.05em' }}>FILTER AC</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Brand Filter */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Merk AC</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['Daikin', 'Panasonic', 'Gree', 'Sharp', 'Mitsubishi'].map(brandName => (
                    <label key={brandName} className="inv-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={brandFilter.toLowerCase() === brandName.toLowerCase()} 
                        onChange={() => setBrandFilter(brandFilter.toLowerCase() === brandName.toLowerCase() ? '' : brandName.toLowerCase())}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      {brandName}
                    </label>
                  ))}
                </div>
              </div>

              {/* PK Capacity Filter */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Kapasitas PK</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['0.5', '0.75', '1', '1.5', '2'].map(pk => (
                    <label key={pk} className="inv-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={pkFilter === pk} 
                        onChange={() => setPkFilter(pkFilter === pk ? '' : pk)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      {pk} PK
                    </label>
                  ))}
                </div>
              </div>

              {/* Technology Type Filter */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase' }}>Teknologi</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Inverter', value: 'inverter' },
                    { label: 'Standard', value: 'standard' },
                    { label: 'Low Watt', value: 'low' }
                  ].map(tech => (
                    <label key={tech.value} className="inv-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={typeFilter === tech.value} 
                        onChange={() => setTypeFilter(typeFilter === tech.value ? '' : tech.value)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      {tech.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* 📦 Main Grid Area */}
          <div className="inv-main">
            {loading ? (
              <InlineLoader text="Memuat katalog..." />
            ) : (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '16px', fontWeight: '500' }}>
                  Menampilkan {filteredProducts.length} unit AC terbaik
                </div>
                <div className="inventory-grid" style={{ paddingBottom: '32px', width: '100%' }}>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div key={product.id} style={{ position: 'relative' }}>
                        <ProductCard
                          image={product.image_url}
                          brand={product.brand}
                          name={product.name}
                          type={product.type || product.category}
                          price={formatRupiah(product.price)}
                          specs={[`${product.capacity_pk} PK`, product.stock > 0 ? 'Ready' : 'Indent']}
                          status={product.stock > 0 ? 'Tersedia' : 'Habis'}
                          onClick={() => navigate(`/inventory/${product.id}`)}
                        />
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={Package} text="Produk tidak ditemukan di katalog." />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <Navigation />
    </div>
  );
};

export default AdminCatalog;
