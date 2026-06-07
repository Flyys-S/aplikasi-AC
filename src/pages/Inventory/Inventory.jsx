import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Package, ArrowUpDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import ProductCard from '../../components/ProductCard';
import '../SalesDashboard/SalesDashboard.css';
import './Inventory.css';

const PK_OPTIONS = ['1/2', '3/4', '1', '1.5', '2', '2.5'];
const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nama A-Z' },
  { value: 'name-desc', label: 'Nama Z-A' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'stock-asc', label: 'Stok Terendah' },
  { value: 'stock-desc', label: 'Stok Tertinggi' },
];

const Inventory = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPKs, setSelectedPKs] = useState([]);

  // Sort
  const [sortBy, setSortBy] = useState('name-asc');
  const [showSortPopup, setShowSortPopup] = useState(false);

  // Sidebar collapse state
  const [collapsedSections, setCollapsedSections] = useState({});

  const fetchProducts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Derive unique brands and categories
  const allBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const allCategories = [...new Set(products.map(p => p.type || p.category).filter(Boolean))].sort();

  // Toggle helpers
  const toggleArrayFilter = (arr, setArr, value) => {
    setArr(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Status helper
  const getStatusLabel = (stock) => {
    if (stock <= 0) return 'Habis';
    if (stock <= 5) return 'Menipis';
    return 'Tersedia';
  };

  const getStatusColor = (status) => {
    if (status === 'Habis') return 'var(--color-error, #e53935)';
    if (status === 'Menipis') return 'var(--color-warning, #fb8c00)';
    return 'var(--color-success, #43a047)';
  };

  // Filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(product.type || product.category);

    const matchesBrand = selectedBrands.length === 0 ||
      selectedBrands.includes(product.brand);

    const matchesStatus = selectedStatuses.length === 0 ||
      selectedStatuses.includes(getStatusLabel(product.stock));

    const matchesPK = selectedPKs.length === 0 ||
      selectedPKs.includes(String(product.capacity_pk));

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesPK;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'stock-asc': return a.stock - b.stock;
      case 'stock-desc': return b.stock - a.stock;
      default: return 0;
    }
  });

  // Active filters count
  const activeFilterCount = selectedCategories.length + selectedBrands.length + selectedStatuses.length + selectedPKs.length;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedStatuses([]);
    setSelectedPKs([]);
    setSearchQuery('');
  };

  // Stock summary
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="dashboard-container">
      <TopHeader 
        title="Inventori" 
        subtitle={isAdmin ? "Kelola Stok Produk AC" : "Daftar Stok Produk AC"}
      >
        {isAdmin && (
          <div 
            className="icon-btn" 
            style={{ backgroundColor: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
            onClick={() => navigate('/inventory/new')}
          >
            <Plus size={20} />
          </div>
        )}
      </TopHeader>

      <div className="page-content fade-in">
        {/* Stock Summary Cards */}
        <div className="inv-summary-row">
          <div className="inv-summary-card glass-panel">
            <span className="inv-summary-label">Total Produk</span>
            <span className="inv-summary-value">{products.length}</span>
          </div>
          <div className="inv-summary-card glass-panel">
            <span className="inv-summary-label">Total Stok</span>
            <span className="inv-summary-value">{totalStock.toLocaleString()}</span>
          </div>
          <div className="inv-summary-card glass-panel" style={{ borderLeft: '3px solid var(--color-warning, #fb8c00)' }}>
            <span className="inv-summary-label">Stok Menipis</span>
            <span className="inv-summary-value" style={{ color: 'var(--color-warning, #fb8c00)' }}>{lowStockCount}</span>
          </div>
          <div className="inv-summary-card glass-panel" style={{ borderLeft: '3px solid var(--color-error, #e53935)' }}>
            <span className="inv-summary-label">Stok Habis</span>
            <span className="inv-summary-value" style={{ color: 'var(--color-error, #e53935)' }}>{outOfStockCount}</span>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="inv-layout">
          {/* LEFT: Sidebar Filter */}
          <aside className="inv-sidebar glass-panel">
            <div className="inv-sidebar-header">
              <h3 className="inv-sidebar-title">Filter</h3>
              {activeFilterCount > 0 && (
                <button className="inv-clear-btn" onClick={clearAllFilters}>
                  Hapus Semua ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="inv-filter-section">
                <button className="inv-filter-heading" onClick={() => toggleSection('category')}>
                  <span>Kategori</span>
                  {collapsedSections.category ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
                {!collapsedSections.category && (
                  <div className="inv-filter-options">
                    {allCategories.map(cat => (
                      <label key={cat} className="inv-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleArrayFilter(selectedCategories, setSelectedCategories, cat)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brand Filter */}
            <div className="inv-filter-section">
              <button className="inv-filter-heading" onClick={() => toggleSection('brand')}>
                <span>Merk</span>
                {collapsedSections.brand ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {!collapsedSections.brand && (
                <div className="inv-filter-options">
                  {allBrands.map(brand => (
                    <label key={brand} className="inv-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleArrayFilter(selectedBrands, setSelectedBrands, brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Status Filter */}
            <div className="inv-filter-section">
              <button className="inv-filter-heading" onClick={() => toggleSection('status')}>
                <span>Status Stok</span>
                {collapsedSections.status ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {!collapsedSections.status && (
                <div className="inv-filter-options">
                  {['Tersedia', 'Menipis', 'Habis'].map(status => (
                    <label key={status} className="inv-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleArrayFilter(selectedStatuses, setSelectedStatuses, status)}
                      />
                      <span className="inv-status-dot" style={{ backgroundColor: getStatusColor(status) }} />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT: Main Content */}
          <div className="inv-main">
            {/* Search + Sort Bar */}
            <div className="inv-toolbar">
              <div className="search-input-wrapper card-elevation">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Cari produk inventori..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="inv-search-clear" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="inv-sort-wrapper">
                <button 
                  className={`inv-sort-btn card-elevation ${showSortPopup ? 'active' : ''}`}
                  onClick={() => setShowSortPopup(prev => !prev)}
                >
                  <ArrowUpDown size={18} />
                </button>
                {showSortPopup && (
                  <>
                    <div className="inv-sort-backdrop" onClick={() => setShowSortPopup(false)} />
                    <div className="inv-sort-popup glass-panel">
                      <div className="inv-sort-popup-title">Urutkan Berdasarkan</div>
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`inv-sort-option ${sortBy === opt.value ? 'active' : ''}`}
                          onClick={() => { setSortBy(opt.value); setShowSortPopup(false); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Filter: PK */}
            <div className="inv-quick-filters">
              <span className="inv-quick-label">PK:</span>
              {PK_OPTIONS.map(pk => (
                <button
                  key={pk}
                  className={`inv-pk-chip ${selectedPKs.includes(pk) ? 'active' : ''}`}
                  onClick={() => toggleArrayFilter(selectedPKs, setSelectedPKs, pk)}
                >
                  {pk} PK
                </button>
              ))}
            </div>

            {/* Active Filters Badges */}
            {activeFilterCount > 0 && (
              <div className="inv-active-badges">
                {selectedCategories.map(c => (
                  <span key={`cat-${c}`} className="inv-badge">
                    {c}
                    <button onClick={() => toggleArrayFilter(selectedCategories, setSelectedCategories, c)}><X size={12} /></button>
                  </span>
                ))}
                {selectedBrands.map(b => (
                  <span key={`brand-${b}`} className="inv-badge">
                    {b}
                    <button onClick={() => toggleArrayFilter(selectedBrands, setSelectedBrands, b)}><X size={12} /></button>
                  </span>
                ))}
                {selectedStatuses.map(s => (
                  <span key={`status-${s}`} className="inv-badge">
                    {s}
                    <button onClick={() => toggleArrayFilter(selectedStatuses, setSelectedStatuses, s)}><X size={12} /></button>
                  </span>
                ))}
                {selectedPKs.map(pk => (
                  <span key={`pk-${pk}`} className="inv-badge">
                    {pk} PK
                    <button onClick={() => toggleArrayFilter(selectedPKs, setSelectedPKs, pk)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Results count */}
            <div className="inv-result-count">
              Menampilkan <strong>{sortedProducts.length}</strong> dari <strong>{products.length}</strong> produk
            </div>

            {/* Product Grid */}
            {loading ? (
              <InlineLoader text="Memuat data produk..." />
            ) : (
              <div className="inventory-grid">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      image={product.image_url}
                      brand={product.brand}
                      name={product.name}
                      type={product.type || product.category}
                      price={formatRupiah(product.price)}
                      specs={[`Stok: ${product.stock} unit`, `${product.capacity_pk} PK`]}
                      status={getStatusLabel(product.stock)}
                      onClick={() => navigate(`/inventory/${product.id}`)}
                    />
                  ))
                ) : (
                  <EmptyState icon={Package} text="Tidak ada produk yang ditemukan." />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Inventory;
