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
  const { user } = useAuth();
  const catalogSectionRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('arctic_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const baseUrl = import.meta.env.BASE_URL || '/';

  return (
    <div className={`dashboard-container ${!user ? 'guest-layout' : ''}`}>
      <header className="catalog-header glass-panel fade-in">
        <div className="catalog-header-centered">
          <span className="logo-icon">❄️</span>
          <span className="catalog-header-brand">Arctic Clarity</span>
        </div>
        {user && (
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
      </header>

      <div className="page-content fade-in">
        {!user && (
          <section className="company-profile-hero glass-panel fade-in" style={{ marginBottom: '40px' }}>
            {/* Premium Animated Sliding Image Carousel Section */}
            <div className="hero-carousel-container">
              <div className="hero-carousel-track">
                <div className="carousel-slide">
                  <img src={`${baseUrl}hero_living_room.png`} alt="Premium Living Room" />
                  <div className="carousel-caption">
                    <h3>Arctic Clarity - Kenyamanan Udara Premium</h3>
                    <p>Menghadirkan pendingin udara berkualitas tinggi dan orisinal untuk kenyamanan hunian modern Anda.</p>
                  </div>
                </div>
                <div className="carousel-slide">
                  <img src={`${baseUrl}technician_service.png`} alt="Technician Service" />
                  <div className="carousel-caption">
                    <h3>Layanan Instalasi & Pemeliharaan Profesional</h3>
                    <p>Dukungan teknisi ahli bersertifikat untuk memastikan performa pendingin ruangan Anda optimal.</p>
                  </div>
                </div>
                <div className="carousel-slide">
                  <img src={`${baseUrl}premium_ac_unit.png`} alt="Premium AC Unit" />
                  <div className="carousel-caption">
                    <h3>Solusi Hemat Energi Ramah Lingkungan</h3>
                    <p>Pilihan AC pintar dengan efisiensi daya tinggi untuk penghematan listrik berkelanjutan.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-profile-info glass-panel card-elevation">
              <h2>Tentang Perusahaan</h2>
              <p>
                Arctic Clarity adalah penyedia solusi tata udara premium berstandar internasional. 
                Kami menghadirkan unit pendingin udara 100% orisinal dengan garansi resmi, 
                serta layanan pemasangan dan perawatan terpadu oleh teknisi bersertifikat.
              </p>
              
              <div className="hero-auth-actions">
                <p>Silakan masuk atau daftar untuk memesan produk dari katalog kami</p>
                <div className="hero-auth-buttons">
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Masuk ke Akun
                  </Button>
                  <Button onClick={() => navigate('/signup')}>
                    Daftar Sekarang
                  </Button>
                </div>
              </div>
            </div>
            
            <button className="explore-catalog-btn" onClick={scrollToCatalog}>
              Jelajahi Katalog AC 👇
            </button>
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
                    onClick={() => user && navigate(`/inventory/${product.id}`)}
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
              <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
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
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ border: 'none', background: 'none', padding: '4px 8px' }}><Minus size={14} /></button>
                          <span style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ border: 'none', background: 'none', padding: '4px 8px' }}><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} style={{ border: 'none', background: 'none', color: '#ff4444', fontSize: '12px' }}>Hapus</button>
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

      {user && <Navigation />}
    </div>
  );
};

export default Catalog;


