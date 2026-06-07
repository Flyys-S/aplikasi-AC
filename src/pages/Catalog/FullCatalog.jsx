import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Loader2, Plus, Minus, X, CreditCard, Package, ChevronLeft, ArrowUpDown, Sun, Moon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import './Catalog.css';

const FullCatalog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Initial params
  const initialSearch = searchParams.get('search') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialPk = searchParams.get('pk') || '';
  const initialCategory = searchParams.get('category') || '';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters - PK and Brand allow multiple selections, Category remains mutually exclusive
  const [pkFilters, setPkFilters] = useState(initialPk ? [initialPk] : []);
  const [brandFilters, setBrandFilters] = useState(initialBrand ? [initialBrand.toLowerCase()] : []);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || ''); // mutually exclusive
  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Cart state
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('arctic_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customize Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseType, setPurchaseType] = useState('package'); 
  const [pipeGrade, setPipeGrade] = useState('premium'); 
  const [pipeLength, setPipeLength] = useState(3);

  // Sync Cart
  useEffect(() => {
    localStorage.setItem('arctic_cart', JSON.stringify(cart));
  }, [cart]);

  // Reset customize options when product changes
  useEffect(() => {
    if (selectedProduct) {
      setPurchaseType('package');
      setPipeGrade('premium');
      setPipeLength(3);
    }
  }, [selectedProduct]);

  // Fetch products
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

  // Cart Functions
  const getPackageCosts = (grade) => {
    switch (grade) {
      case 'basic':
        return { base: 500000, perMeter: 100000, desc: 'Pipa Basic (0.50mm) - Ekonomis' };
      case 'elite':
        return { base: 950000, perMeter: 160000, desc: 'Pipa Elite (0.76mm Standard ASTM) - Terbaik' };
      case 'premium':
      default:
        return { base: 700000, perMeter: 130000, desc: 'Pipa Premium (0.60mm JIS) - Rekomendasi Inverter' };
    }
  };

  const calculateProductTotalPrice = (product, type, grade, length) => {
    if (!product) return 0;
    let total = product.price;
    if (type === 'package') {
      const costs = getPackageCosts(grade);
      total += costs.base;
      if (length > 3) {
        total += (length - 3) * costs.perMeter;
      }
    }
    return total;
  };

  const addToCart = (product, customOpts = null) => {
    const cartItemId = customOpts
      ? `${product.id}-${customOpts.purchaseType}-${customOpts.purchaseType === 'package' ? customOpts.pipeGrade : ''}-${customOpts.purchaseType === 'package' ? customOpts.pipeLength : ''}`
      : `${product.id}-unit`;

    const finalPrice = customOpts
      ? calculateProductTotalPrice(product, customOpts.purchaseType, customOpts.pipeGrade, customOpts.pipeLength)
      : product.price;

    const configLabel = customOpts && customOpts.purchaseType === 'package'
      ? `Paket Pasang ${customOpts.pipeGrade.toUpperCase()} (${customOpts.pipeLength}m)`
      : `Unit Saja`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (existing) {
      setCart(cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        ...product,
        cartItemId,
        configLabel,
        price: finalPrice,
        originalPrice: product.price,
        quantity: 1,
        customOpts
      }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPK = pkFilters.length > 0 ? pkFilters.includes(String(product.capacity_pk)) : true;
    const matchesBrand = brandFilters.length > 0 ? brandFilters.includes(product.brand.toLowerCase()) : true;
    
    let matchesCategory = true;
    if (categoryFilter) {
      matchesCategory = product.name.toLowerCase().includes(categoryFilter.toLowerCase()) ||
                        (product.type && product.type.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    return matchesSearch && matchesPK && matchesBrand && matchesCategory;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    // Default/popular sorting: by name/brand
    return a.brand.localeCompare(b.brand);
  });

  const isVisitor = role === 'visitor';
  const hasNormalSidebar = role === 'admin' || role === 'technician';
  const containerClass = hasNormalSidebar ? '' : (isVisitor ? ' customer-layout' : ' guest-layout');

  return (
    <div className={`dashboard-container${containerClass}`}>
      {isAdmin ? (
        <TopHeader title="Katalog Utama" subtitle="Seluruh Produk AC" />
      ) : (
        <header className="catalog-header glass-panel">
          <div className="catalog-header-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <ChevronLeft size={20} style={{ color: 'var(--color-primary)', marginRight: '4px' }} />
            <span className="logo-icon">❄️</span>
            <span className="catalog-header-brand">MITRA MAJU SEJATI</span>
          </div>
          
          <div className="catalog-header-right">
            <div className="guest-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Theme Toggle Mode Button */}
              <button 
                className="icon-btn theme-toggle-btn" 
                onClick={toggleTheme} 
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-outline-variant)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  backgroundColor: 'var(--color-surface-container-high)',
                  color: 'var(--color-on-surface)'
                }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div
                className="icon-btn cart-btn-header"
                style={{
                  backgroundColor: cart.length > 0 ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                  color: cart.length > 0 ? 'white' : 'var(--color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              {!user ? (
                <Button size="small" onClick={() => navigate('/login')}>Login</Button>
              ) : (
                <Button size="small" variant="outline" onClick={() => navigate('/profile')}>Akun Saya</Button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Navigation banner - only for non-admin */}
      {!isAdmin && <Navigation />}

      <main style={{ padding: '32px var(--gutter)', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
        
        {/* Left Filter Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Combined Filters Panel */}
          <div style={{ background: 'var(--color-surface-container-low)', padding: '24px', borderRadius: '20px', border: '1px solid var(--color-outline-variant)', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Filter Kategori */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '16px', letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Filter Kategori</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Semua Kategori', value: '' },
                  { name: 'AC Split Standard', value: 'standard' },
                  { name: 'AC Split Low Watt', value: 'low watt' },
                  { name: 'AC Split Inverter', value: 'inverter' }
                ].map(cat => (
                  <div 
                    key={cat.name} 
                    onClick={() => setCategoryFilter(cat.value)}
                    style={{ 
                      fontSize: '13px', 
                      fontWeight: categoryFilter === cat.value ? '800' : '500', 
                      color: categoryFilter === cat.value ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="category"
                      checked={categoryFilter === cat.value}
                      onChange={() => {}}
                      style={{ pointerEvents: 'none', cursor: 'pointer' }}
                    />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-outline-variant)', margin: 0 }} />

            {/* Filter Merk */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '16px', letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Filter Merk (Multiple)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Daikin', value: 'daikin' },
                  { name: 'Gree', value: 'gree' },
                  { name: 'Sharp', value: 'sharp' },
                  { name: 'Panasonic', value: 'panasonic' },
                  { name: 'Mitsubishi', value: 'mitsubishi' }
                ].map(brand => {
                  const isChecked = brandFilters.includes(brand.value);
                  return (
                    <div 
                      key={brand.name} 
                      onClick={() => {
                        setBrandFilters(prev => 
                          prev.includes(brand.value) 
                            ? prev.filter(b => b !== brand.value) 
                            : [...prev, brand.value]
                        );
                      }}
                      style={{ 
                        fontSize: '13px', 
                        fontWeight: isChecked ? '800' : '500', 
                        color: isChecked ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ pointerEvents: 'none', cursor: 'pointer' }}
                      />
                      {brand.name}
                    </div>
                  );
                })}
                {brandFilters.length > 0 && (
                  <button 
                    onClick={() => setBrandFilters([])}
                    style={{ border: 'none', background: 'transparent', color: '#ff4444', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'left', marginTop: '4px', padding: 0 }}
                  >
                    Bersihkan Merk
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Title & Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>
              Katalog AC Split <span style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', fontWeight: '600', marginLeft: '8px' }}>({sortedProducts.length} Produk)</span>
            </h2>
            
            {/* Search Input bar & Sort Pop-up */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
              <div className="search-input-wrapper card-elevation" style={{ maxWidth: '300px', margin: 0 }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari tipe AC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                />
              </div>

              {/* Sort Pop-up Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(prev => !prev)}
                  className="icon-btn card-elevation"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: showSortDropdown ? 'var(--color-primary)' : 'var(--color-surface-container-lowest)',
                    color: showSortDropdown ? 'white' : 'var(--color-on-surface)',
                    border: '1px solid var(--color-outline-variant)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Urutkan Produk"
                >
                  <ArrowUpDown size={18} />
                </button>

                {/* Dropdown Menu */}
                {showSortDropdown && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '48px',
                      right: 0,
                      width: '200px',
                      background: 'var(--color-surface-container-lowest)',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: '16px',
                      boxShadow: 'var(--shadow-hover)',
                      padding: '8px',
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    className="fade-in-scale"
                  >
                    {[
                      { name: 'Produk Terpopuler', value: 'popular' },
                      { name: 'Harga Terendah', value: 'price-low' },
                      { name: 'Harga Tertinggi', value: 'price-high' }
                    ].map(sort => (
                      <div
                        key={sort.value}
                        onClick={() => {
                          setSortBy(sort.value);
                          setShowSortDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: sortBy === sort.value ? '800' : '500',
                          color: sortBy === sort.value ? 'var(--color-primary)' : 'var(--color-on-surface)',
                          background: sortBy === sort.value ? 'rgba(0, 85, 255, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {sort.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Filters: PK Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', marginRight: '8px' }}>FILTER PK (MULTIPLE):</span>
            {[
              { label: '1/2 PK', value: '0.5' },
              { label: '3/4 PK', value: '0.75' },
              { label: '1 PK', value: '1' },
              { label: '1.5 PK', value: '1.5' },
              { label: '2 PK', value: '2' }
            ].map(pk => {
              const isSelected = pkFilters.includes(pk.value);
              return (
                <button
                  key={pk.label}
                  onClick={() => {
                    setPkFilters(prev => 
                      prev.includes(pk.value) 
                        ? prev.filter(p => p !== pk.value) 
                        : [...prev, pk.value]
                    );
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-outline-variant)',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                    color: isSelected ? 'white' : 'var(--color-on-surface)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {pk.label}
                </button>
              );
            })}
            {pkFilters.length > 0 && (
              <button 
                onClick={() => setPkFilters([])}
                style={{ border: 'none', background: 'transparent', color: '#ff4444', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
              >
                Reset PK
              </button>
            )}
          </div>

          {/* Active Filter Badges */}
          {(pkFilters.length > 0 || brandFilters.length > 0 || categoryFilter) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {pkFilters.map(pk => (
                <div key={pk} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: '700' }}>
                  PK: {pk} PK <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPkFilters(prev => prev.filter(p => p !== pk))} />
                </div>
              ))}
              {brandFilters.map(brand => (
                <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', textTransform: 'capitalize' }}>
                  Merk: {brand} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setBrandFilters(prev => prev.filter(b => b !== brand))} />
                </div>
              ))}
              {categoryFilter && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', textTransform: 'capitalize' }}>
                  Tipe: {categoryFilter} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('')} />
                </div>
              )}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <InlineLoader text="Memuat produk..." />
          ) : (
            <div className="inventory-grid" style={{ paddingBottom: '100px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {sortedProducts.length > 0 ? (
                sortedProducts.map(product => (
                  <div key={product.id} style={{ position: 'relative' }}>
                    <ProductCard
                      image={product.image_url}
                      title={`${product.brand} ${product.name}`}
                      price={formatRupiah(product.price)}
                      specs={[`${product.capacity_pk} PK`, product.stock > 0 ? 'Ready Stock' : 'Indent']}
                      status={product.stock > 0 ? 'Tersedia' : 'Habis'}
                      onClick={() => {
                        if (user && isAdmin) {
                          navigate(`/inventory/${product.id}`);
                        } else {
                          setSelectedProduct(product);
                        }
                      }}
                    />
                    {user && (
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          right: '20px',
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,85,255,0.3)'
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1' }}>
                  <EmptyState icon={Package} text="Produk tidak ditemukan di katalog." />
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Cart Sidebar/Drawer */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3><ShoppingCart size={20} className="spec-icon-main" /> Keranjang Saya</h3>
              <button className="icon-btn" onClick={() => setIsCartOpen(false)}><X size={20} /></button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <EmptyState icon={ShoppingCart} text="Keranjang masih kosong." />
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId || item.id} className="cart-item-card">
                    <div className="cart-item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={`${item.brand} ${item.name}`} />
                      ) : (
                        <X size={20} color="var(--color-outline)" />
                      )}
                    </div>
                    <div className="cart-item-info">
                      <h4>{item.brand} {item.name}</h4>
                      {item.configLabel && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: 'var(--color-on-surface-variant)', 
                          backgroundColor: 'var(--color-surface-container-high)', 
                          padding: '2px 8px', 
                          borderRadius: '6px',
                          alignSelf: 'flex-start',
                          margin: '4px 0'
                        }}>
                          {item.configLabel}
                        </span>
                      )}
                      <p className="cart-item-price">{formatRupiah(item.price)}</p>

                      <div className="cart-item-controls">
                        <div className="cart-item-qty">
                          <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, -1)} style={{ border: 'none', background: 'transparent' }}><Minus size={12} /></button>
                          <span>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, 1)} style={{ border: 'none', background: 'transparent' }}><Plus size={12} /></button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.cartItemId)}>Hapus</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-row">
                  <span className="cart-summary-label">Total Estimasi</span>
                  <span className="cart-summary-value">{formatRupiah(totalPrice)}</span>
                </div>
                <Button fullWidth icon={CreditCard} onClick={() => navigate('/checkout')}>
                  Checkout Sekarang
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customize View Modal */}
      {selectedProduct && (
        <div className="quick-view-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="quick-view-modal glass-panel fade-in-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: '980px' }}>
            <button className="quick-view-close" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>
            <div className="quick-view-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr' }}>
              <div className="quick-view-image-pane" style={{ display: 'flex', flexDirection: 'column', padding: '24px', justifyContent: 'space-between' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ borderRadius: '16px', maxHeight: '280px', objectFit: 'contain' }} />
                  ) : (
                    <div className="quick-view-image-placeholder">No Image</div>
                  )}
                </div>
                
                <div className="details-specs-section" style={{ width: '100%', marginTop: '20px' }}>
                  <h3>Spesifikasi AC</h3>
                  <div className="specs-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div className="spec-item" style={{ padding: '8px 12px' }}>
                      <span className="spec-label">PK</span>
                      <span className="spec-value">{selectedProduct.capacity_pk} PK</span>
                    </div>
                    <div className="spec-item" style={{ padding: '8px 12px' }}>
                      <span className="spec-label">Daya</span>
                      <span className="spec-value">{selectedProduct.power_watt || 'TBA'} W</span>
                    </div>
                    <div className="spec-item" style={{ padding: '8px 12px' }}>
                      <span className="spec-label">Tipe</span>
                      <span className="spec-value">{selectedProduct.type || 'Split'}</span>
                    </div>
                    <div className="spec-item" style={{ padding: '8px 12px' }}>
                      <span className="spec-label">Refrigerant</span>
                      <span className="spec-value">R32</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="quick-view-details-pane">
                <span className="details-brand-badge">{selectedProduct.brand}</span>
                <h2 className="details-title">{selectedProduct.brand} {selectedProduct.name}</h2>
                
                <div className="details-price-row">
                  <span className="details-price-label">Harga Total</span>
                  <span className="details-price">
                    {formatRupiah(calculateProductTotalPrice(selectedProduct, purchaseType, pipeGrade, pipeLength))}
                  </span>
                </div>

                {/* Purchase Type */}
                <div className="purchase-type-section" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '12px' }}>PILIH KATEGORI PEMBELIAN</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div 
                      onClick={() => setPurchaseType('unit')}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${purchaseType === 'unit' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        background: purchaseType === 'unit' ? 'rgba(0, 85, 255, 0.05)' : 'var(--color-surface-container-lowest)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '4px' }}>Hanya Unit AC</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>Tanpa pipa, material, dan jasa pasang</div>
                    </div>
                    
                    <div 
                      onClick={() => setPurchaseType('package')}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: `2px solid ${purchaseType === 'package' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        background: purchaseType === 'package' ? 'rgba(0, 85, 255, 0.05)' : 'var(--color-surface-container-lowest)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '4px' }}>Paket Pasang (Terima Beres)</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>Termasuk pipa tembaga, kabel, bracket, isolasi, vacum, & jasa pasang</div>
                    </div>
                  </div>
                </div>

                {/* Package Options */}
                {purchaseType === 'package' && (
                  <div className="package-options-section animate-slide-down" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '12px' }}>PILIH GRADE PIPA TEMBAGA</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {[
                        { val: 'basic', label: 'Basic Grade (Tebal 0.50mm)', desc: 'Ekonomis, direkomendasikan untuk low-budget.' },
                        { val: 'premium', label: 'Premium Grade (Tebal 0.60mm JIS)', desc: 'Standar tebal inverter, direkomendasikan untuk performa optimal.' },
                        { val: 'elite', label: 'Elite Grade (Tebal 0.76mm ASTM)', desc: 'Tebal & kokoh, terbaik untuk jalur di dalam dinding/plafon.' }
                      ].map(item => (
                        <div 
                          key={item.val}
                          onClick={() => setPipeGrade(item.val)}
                          style={{
                            padding: '14px 18px',
                            borderRadius: '16px',
                            border: `2px solid ${pipeGrade === item.val ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: pipeGrade === item.val ? 'rgba(0, 85, 255, 0.03)' : 'var(--color-surface-container-lowest)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '2px' }}>{item.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>

                    <h3 style={{ fontSize: '13px', fontWeight: '800', marginBottom: '12px' }}>ESTIMASI PANJANG PIPA (METER)</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-container-low)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)' }}>
                        <button 
                          onClick={() => setPipeLength(prev => Math.max(3, prev - 1))}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-on-surface)' }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>{pipeLength}m</span>
                        <button 
                          onClick={() => setPipeLength(prev => prev + 1)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-on-surface)' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                        *Sudah termasuk standar 3 meter bawaan paket.<br />Panjang tambahan dikenakan tarif per meter.
                      </span>
                    </div>
                  </div>
                )}

                <div className="details-cta-section" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
                  {user ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button 
                        fullWidth
                        icon={ShoppingCart} 
                        onClick={() => {
                          addToCart(selectedProduct, {
                            purchaseType,
                            pipeGrade,
                            pipeLength
                          });
                          setSelectedProduct(null);
                        }}
                      >
                        Masukkan Keranjang
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedProduct(null)}>Batal</Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: '0 0 8px 0' }}>
                        Anda harus masuk ke sistem untuk melakukan pemesanan dan menjadwalkan instalasi AC.
                      </p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button fullWidth onClick={() => navigate('/login')}>
                          Masuk untuk Memesan
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedProduct(null)}>Batal</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullCatalog;
