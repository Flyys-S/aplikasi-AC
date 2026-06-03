import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Loader2, Plus, Minus, X, CreditCard, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import '../Inventory/Inventory.css';
import './Catalog.css';

const Catalog = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const catalogSectionRef = useRef(null);
  const containerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parallax 3D tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 15, y: -y * 15 }); // Max tilt angle 15 deg
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };
  
  // Cart State
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('arctic_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const baseUrl = import.meta.env.BASE_URL || '/';

  const carouselImages = [
    { src: `${baseUrl}hero_living_room.png`, caption: 'Kesejukan Premium Hunian Modern' },
    { src: `${baseUrl}technician_service.png`, caption: 'Layanan Pemasangan & Pemeliharaan Profesional' },
    { src: `${baseUrl}premium_ac_unit.png`, caption: 'Solusi Hemat Energi Ramah Lingkungan' }
  ];

  // Auto-scroll slide indicators
  useEffect(() => {
    if (user) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

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

  useEffect(() => {
    localStorage.setItem('arctic_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToCatalog = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`dashboard-container ${!user ? 'guest-layout' : ''}`}>
      <header className="catalog-header glass-panel fade-in">
        <div className="catalog-header-left">
          <span className="logo-icon">❄️</span>
          <span className="catalog-header-brand">PT. MITRA MAJU SEJATI</span>
        </div>
        <div className="catalog-header-right">
          {!user ? (
            <div className="guest-actions">
              <Button size="small" variant="outline" onClick={() => navigate('/login')}>
                Masuk
              </Button>
              <Button size="small" onClick={() => navigate('/signup')}>
                Daftar
              </Button>
            </div>
          ) : (
            <div className="catalog-header-actions">
              <div 
                className="icon-btn cart-btn-header" 
                style={{ 
                  backgroundColor: cart.length > 0 ? 'var(--color-primary)' : 'var(--color-surface-container-high)', 
                  color: cart.length > 0 ? 'white' : 'inherit', 
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-5px', 
                    right: '-5px', 
                    backgroundColor: '#ff4444', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '18px', 
                    height: '18px', 
                    fontSize: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold' 
                  }}>
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="page-content fade-in">
        {!user && (
          <section className="premium-split-hero fade-in">
            {/* Left Side: Brand statements & CTA */}
            <div className="hero-statement-card glass-panel">
              <div className="hero-brand-badge">COMFORT & QUALITY CO.</div>
              <h1 className="hero-premium-title">
                PT. MITRA MAJU SEJATI
              </h1>
              <p className="hero-premium-subtitle">
                Penyedia solusi tata udara premium berstandar internasional. Kami menghadirkan unit pendingin udara 100% orisinal dengan garansi resmi, serta layanan pemasangan & perawatan terintegrasi oleh teknisi bersertifikat.
              </p>
              
              <div className="hero-premium-actions">
                <Button variant="primary" onClick={() => navigate('/signup')} style={{ padding: '14px 28px', fontSize: '15px' }}>
                  Daftar Akun Baru
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')} style={{ padding: '14px 28px', fontSize: '15px' }}>
                  Masuk ke Sistem
                </Button>
              </div>

              <div className="hero-interactive-anchor" onClick={scrollToCatalog}>
                <span>Jelajahi Katalog AC</span>
                <span className="anchor-arrow">↓</span>
              </div>
            </div>

            {/* Right Side: Interactive Sliding Image Carousel */}
            <div 
              ref={containerRef}
              className="hero-carousel-container-new card-elevation"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <div 
                className="hero-carousel-track-new"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {carouselImages.map((image, index) => (
                  <div key={index} className="carousel-slide-new">
                    <img src={image.src} alt={image.caption} />
                    <div className="carousel-caption-subtle-new">
                      <p>{image.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Dots */}
              <div className="carousel-dots-container">
                {carouselImages.map((_, index) => (
                  <button 
                    key={index} 
                    className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <div ref={catalogSectionRef} className="search-filter-bar">
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
          <InlineLoader text="Membuka katalog..." />
        ) : (
          <div className="inventory-grid" style={{ paddingBottom: '100px' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
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
                        addToCart(product);
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
              <EmptyState icon={Package} text="Produk tidak ditemukan di katalog." />
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar/Drawer */}
      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="cart-drawer fade-in-right" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="cart-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={20} /> Keranjang Saya</h3>
              <button className="icon-btn" onClick={() => setIsCartOpen(false)}><X size={20} /></button>
            </div>

            <div className="cart-items" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <EmptyState icon={ShoppingCart} text="Keranjang masih kosong." />
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                      {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#ccc" /></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{item.brand} {item.name}</h4>
                      <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{formatRupiah(item.price)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px' }}>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={12} /></button>
                          <span style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={12} /></button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Hapus</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer" style={{ padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '500' }}>Total Estimasi</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '18px' }}>{formatRupiah(totalPrice)}</span>
                </div>
                <Button fullWidth icon={CreditCard} onClick={() => navigate('/checkout')}>
                  Checkout Sekarang
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Quick View Modal */}
      {selectedProduct && (
        <div className="quick-view-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="quick-view-modal glass-panel fade-in-scale" onClick={e => e.stopPropagation()}>
            <button className="quick-view-close" onClick={() => setSelectedProduct(null)}>
              <X size={20} />
            </button>
            <div className="quick-view-content">
              <div className="quick-view-image-pane">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                ) : (
                  <div className="quick-view-image-placeholder">No Image</div>
                )}
              </div>
              <div className="quick-view-details-pane">
                <span className="details-brand-badge">{selectedProduct.brand}</span>
                <h2 className="details-title">{selectedProduct.name}</h2>
                <div className="details-price-row">
                  <span className="details-price-label">Harga Retail</span>
                  <span className="details-price">{formatRupiah(selectedProduct.price)}</span>
                </div>

                <div className="details-specs-section">
                  <h3>Spesifikasi Unit AC</h3>
                  <div className="specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">Kapasitas PK</span>
                      <span className="spec-value">{selectedProduct.capacity_pk} PK</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Daya Listrik</span>
                      <span className="spec-value">{selectedProduct.power_watt || 'TBA'} Watt</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Pendinginan</span>
                      <span className="spec-value">{selectedProduct.cooling_capacity_btu ? `${selectedProduct.cooling_capacity_btu} BTU` : 'TBA'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Status Ketersediaan</span>
                      <span className={`spec-value status-badge ${selectedProduct.stock > 0 ? 'instock' : 'outofstock'}`}>
                        {selectedProduct.stock > 0 ? `Ready Stock (${selectedProduct.stock} unit)` : 'Indent / Habis'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-cta-section">
                  {user ? (
                    <Button 
                      fullWidth 
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                    >
                      Tambah ke Keranjang
                    </Button>
                  ) : (
                    <>
                      <p>Anda harus masuk ke sistem untuk melakukan pemesanan dan menjadwalkan instalasi AC.</p>
                      <Button fullWidth onClick={() => navigate('/login')}>
                        Masuk untuk Memesan
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user && <Navigation />}
    </div>
  );
};

export default Catalog;


