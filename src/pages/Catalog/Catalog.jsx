import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Loader2, Plus, Minus, X, CreditCard, Package, Sun, Moon, ChevronLeft, ChevronRight, Menu, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Navigation from '../../components/Navigation';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import '../Inventory/Inventory.css';
import './Catalog.css';
import toast from 'react-hot-toast';

const Catalog = () => {
  const navigate = useNavigate();
  const { user, isAdmin, role, isBioComplete } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (isCartOpen || selectedProduct) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isCartOpen, selectedProduct]);

  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Promo Carousel State & Auto-slide
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const promoTimerRef = useRef(null);

  const startPromoTimer = useCallback(() => {
    if (promoTimerRef.current) {
      clearInterval(promoTimerRef.current);
    }
    promoTimerRef.current = setInterval(() => {
      setCurrentPromoSlide(prev => (prev + 1) % 3);
    }, 6000);
  }, []);

  useEffect(() => {
    startPromoTimer();
    return () => {
      if (promoTimerRef.current) {
        clearInterval(promoTimerRef.current);
      }
    };
  }, [startPromoTimer]);

  const handlePrevPromo = () => {
    setCurrentPromoSlide(prev => (prev - 1 + 3) % 3);
    startPromoTimer();
  };

  const handleNextPromo = () => {
    setCurrentPromoSlide(prev => (prev + 1) % 3);
    startPromoTimer();
  };

  const [pkFilter, setPkFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Selected Product Customize State
  const [purchaseType, setPurchaseType] = useState('package'); // 'unit' or 'package'
  const [pipeGrade, setPipeGrade] = useState('premium'); // 'basic', 'premium', 'elite'
  const [pipeLength, setPipeLength] = useState(3); // default 3 meters

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

  // Reset product customization on selection change
  useEffect(() => {
    if (selectedProduct) {
      const timer = setTimeout(() => {
        setPurchaseType('package');
        setPipeGrade('premium');
        setPipeLength(3);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedProduct]);

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

  useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin-catalog', { replace: true });
    } else if (user && role === 'technician') {
      navigate('/technician', { replace: true });
    }
  }, [user, role, navigate]);

  // Pricing constants for options
  const getPackageCosts = (grade) => {
    switch (grade) {
      case 'basic':
        return { base: 500000, perMeter: 100000, desc: 'Pipa Basic (0.50mm) - Ekonomis' };
      case 'elite':
        return { base: 950000, perMeter: 160000, desc: 'Pipa Elite (0.76mm Standard ASTM) - Terbaik untuk Dinding/Plafon' };
      case 'premium':
      default:
        return { base: 700000, perMeter: 130000, desc: 'Pipa Premium (0.60mm Standard JIS) - Direkomendasikan untuk Inverter' };
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
    if (user && role === 'visitor' && !isBioComplete) {
      toast.error('Silakan lengkapi biodata Anda (Nama, No. Telepon, dan Alamat) di halaman profil terlebih dahulu!');
      navigate('/profile');
      return;
    }

    // Generate distinct ID for different configuration items in cart
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPK = pkFilter ? String(product.capacity_pk) === pkFilter : true;
    const matchesBrand = brandFilter ? product.brand.toLowerCase() === brandFilter.toLowerCase() : true;
    return matchesSearch && matchesPK && matchesBrand;
  });

  const scrollToCatalog = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isVisitorOrGuest = !user || role === 'visitor';

  return (
    <>
      <div className={`dashboard-container ${isVisitorOrGuest ? 'customer-layout' : 'guest-layout'}`}>
      <header className="catalog-header glass-panel fade-in">
        <div className="catalog-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isVisitorOrGuest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
              <button 
                className="icon-btn back-btn-customer" 
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                className="icon-btn hamburger-btn-customer" 
                onClick={() => document.body.classList.toggle('sidebar-open')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          )}
          <span className="logo-icon">❄️</span>
          <span className="catalog-header-brand">MITRA MAJU SEJATI</span>
        </div>
        <div className="catalog-header-right">
          {!user ? (
            <div className="guest-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="icon-btn cart-btn-header"
                style={{
                  backgroundColor: cart.length > 0 ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                  color: cart.length > 0 ? 'white' : 'inherit',
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate('/login')}
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

              <span style={{ borderLeft: '1px solid var(--color-outline-variant)', height: '24px', margin: '0 6px' }}></span>

              <Button size="small" variant="outline" onClick={() => navigate('/login')} style={{ minWidth: '80px', height: '30px' }}>
                Masuk
              </Button>
              <Button size="small" onClick={() => navigate('/signup')} style={{ minWidth: '80px', height: '30px' }}>
                Daftar
              </Button>
            </div>
          ) : (
            <div className="catalog-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  color: cart.length > 0 ? 'white' : 'inherit',
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
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
        {!isAdmin && (
          <div className="selka-homepage-layout fade-in">
            {/* 1. Hero Promo Banner Slider */}
            <section className="selka-hero-slider card-elevation" style={{ position: 'relative', overflow: 'hidden', borderRadius: '32px', height: '420px', marginBottom: '32px' }}>
              <div
                className="hero-carousel-track-new"
                style={{
                  display: 'flex',
                  height: '100%',
                  width: `${carouselImages.length * 100}%`,
                  transform: `translateX(-${(currentSlide * 100) / carouselImages.length}%)`,
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {carouselImages.map((image, index) => (
                  <div key={index} className="carousel-slide-new" style={{ width: `${100 / carouselImages.length}%`, height: '100%', position: 'relative' }}>
                    <img src={image.src} alt={image.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
                    <div className="selka-hero-caption-overlay" style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '48px',
                      color: 'white',
                      background: 'linear-gradient(to right, rgba(0, 85, 255, 0.4) 0%, rgba(0,0,0,0.4) 100%)'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--color-primary)', padding: '6px 16px', borderRadius: '20px', alignSelf: 'flex-start', marginBottom: '16px' }}>SUPERMARKET AC TERPERCAYA</span>
                      <h1 style={{ fontSize: '38px', fontWeight: '900', margin: '0 0 16px 0', lineHeight: '1.2' }}>{image.caption}</h1>
                      <p style={{ fontSize: '15px', maxWidth: '600px', margin: '0 0 24px 0', opacity: 0.9 }}>Beli AC baru kini sangat praktis. Pilih unitnya, sesuaikan paket pipa tembaga premium pilihan Anda, dan atur jadwal pasang instan H-1.</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button onClick={scrollToCatalog}>Belanja AC Sekarang</Button>
                        {!user && (
                          <Button variant="outline" style={{ color: 'white', borderColor: 'white' }} onClick={() => navigate('/login')}>Masuk / Daftar Akun</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="carousel-dots-container" style={{ bottom: '24px' }}>
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </section>

            {/* 2. Selka-style Category shortcuts */}
            <section className="selka-categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[
                { title: 'AC MULTI SPLIT', icon: '❄️', query: 'multi' },
                { title: 'AC PORTABLE', icon: '📱', query: 'portable' },
                { title: 'AIR COOLER', icon: '💨', query: 'cooler' },
                { title: 'AC CEILING', icon: '⏹️', query: 'ceiling' },
                { title: 'JASA PASANG', icon: '🔧', query: 'pasang' },
                { title: 'CUCI AC', icon: '🧼', query: 'cuci' },
                { title: 'PK CALCULATOR', icon: '🧮', link: '/tools?tab=pk' },
                { title: 'MULTI S TOOLS', icon: '⚙️', link: '/tools?tab=kwh' }
              ].map((cat, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (cat.link) {
                      navigate(cat.link);
                    } else {
                      navigate(`/catalog?search=${cat.query}`);
                    }
                  }}
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '16px',
                    padding: '16px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-diffused)'
                  }}
                  className="category-card"
                >
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{cat.icon}</span>
                  <span style={{ fontWeight: '800', fontSize: '11px', color: 'var(--color-on-surface)', textTransform: 'uppercase', display: 'block' }}>{cat.title}</span>
                </div>
              ))}
            </section>

            {/* 4. Cara Belanja Selka-style (Step by step flow) */}
            <section className="selka-shopping-steps-section" style={{ marginBottom: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>Bagaimana Cara Belanja Paket AC di Sini?</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>4 langkah mudah mendapatkan pendingin ruangan berkualitas tanpa repot.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {[
                  { step: '1', title: 'Pilih Unit AC', desc: 'Gunakan kalkulator PK atau filter brand untuk menemukan unit AC terbaik.' },
                  { step: '2', title: 'Pilih Paket Material', desc: 'Pilih grade pipa tembaga (Basic/Premium/Elite) serta estimasi meteran pipa.' },
                  { step: '3', title: 'Jadwalkan Pemasangan', desc: 'Pilih jadwal pemasangan tercepat H-1 dari antarmuka kalender yang aman.' },
                  { step: '4', title: 'Teknisi Datang', desc: 'Teknisi profesional kami mengirim, memasang unit, serta mengaktifkan garansi 30 hari.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--color-surface-container-low)', padding: '24px', borderRadius: '24px', position: 'relative', border: '1px solid var(--color-outline-variant)' }}>
                    <span style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '32px', fontWeight: '900', color: 'var(--color-outline)', opacity: 0.35 }}>{item.step}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--color-primary)' }}>{item.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4.5. 🏷️ Promo & Voucher Banner Section */}
            <section className="selka-promo-section" style={{ marginBottom: '40px' }}>
              <div className="promo-carousel-container">
                {/* Arrow Navigation */}
                <button className="promo-arrow prev" onClick={handlePrevPromo} aria-label="Previous Promo">
                  <ChevronLeft size={20} />
                </button>
                <button className="promo-arrow next" onClick={handleNextPromo} aria-label="Next Promo">
                  <ChevronRight size={20} />
                </button>

                {/* Carousel Track */}
                <div 
                  className="promo-carousel-track" 
                  style={{ transform: `translateX(-${currentPromoSlide * 100}%)` }}
                >
                  {/* Slide 1: Cuci AC */}
                  <div className="promo-slide-item" style={{ background: '#0b1320', color: '#ffffff' }}>
                    <div className="promo-slide-left">
                      <h3>CUCI AC GARANSI 14 HARI 👍</h3>
                      <div className="promo-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="promo-star-icon">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="promo-slide-center">
                      <svg viewBox="0 0 400 120" style={{ width: '100%', maxHeight: '110px', display: 'block' }}>
                        {/* Outdoor Unit */}
                        <rect x="30" y="30" width="85" height="65" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                        <circle cx="72.5" cy="62.5" r="24" fill="none" stroke="#64748b" strokeWidth="2.5" />
                        <path d="M 72.5 38.5 L 72.5 86.5 M 48.5 62.5 L 96.5 62.5 M 55.5 45.5 L 89.5 79.5 M 55.5 79.5 L 89.5 45.5" stroke="#64748b" strokeWidth="1.8" />
                        <rect x="36" y="36" width="22" height="6" rx="2" fill="#e2e8f0" />
                        <line x1="100" y1="42" x2="110" y2="42" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="100" y1="52" x2="110" y2="52" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="100" y1="62" x2="110" y2="62" stroke="#cbd5e1" strokeWidth="2" />
                        
                        {/* Indoor Unit */}
                        <rect x="230" y="22" width="130" height="38" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                        <rect x="236" y="50" width="118" height="6" rx="2" fill="#64748b" opacity="0.3" />
                        <line x1="230" y1="40" x2="360" y2="40" stroke="#e2e8f0" strokeWidth="1.2" />
                        {/* Thumbs up badge next to indoor unit */}
                        <circle cx="215" cy="40" r="12" fill="#facc15" />
                        <text x="210" y="44" fontSize="10">👍</text>

                        {/* Air flow waves */}
                        <path d="M 240 68 Q 250 78 260 68 T 280 68" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                        <path d="M 300 68 Q 310 78 320 68 T 340 68" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.75" />

                        {/* Technician Character */}
                        <circle cx="170" cy="52" r="13" fill="#ffedd5" stroke="#f97316" strokeWidth="2" />
                        {/* Cap */}
                        <path d="M 157 47 C 157 36 183 36 183 47 Z" fill="#3b82f6" />
                        <path d="M 172 38 L 189 43" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" />
                        {/* Overalls */}
                        <path d="M 148 95 L 153 72 C 155 65 185 65 187 72 L 192 95 Z" fill="#3b82f6" />
                        {/* Arm spraying */}
                        <path d="M 182 74 L 208 52 L 225 50" fill="none" stroke="#ffedd5" strokeWidth="6.5" strokeLinecap="round" />
                        {/* Spray gun nozzle */}
                        <path d="M 223 48 L 230 55 M 225 50 L 240 38" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Spray line */}
                        <line x1="240" y1="38" x2="260" y2="30" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3,3" />
                      </svg>
                    </div>

                    <div className="promo-slide-right">
                      <span className="promo-hand-pointer">👉</span>
                      <div className="promo-dashed-box" onClick={() => navigator.clipboard.writeText('SELKACLEAN')}>
                        SELKACLEAN
                      </div>
                      <div className="promo-right-label">KODE CASHBACK CUCI AC</div>
                    </div>
                  </div>

                  {/* Slide 2: Diskon Jasa Pasang */}
                  <div className="promo-slide-item" style={{ background: 'linear-gradient(135deg, #1e0b36 0%, #0c0418 100%)', color: '#ffffff' }}>
                    <div className="promo-slide-left">
                      <h3>DISKON JASA PASANG Rp 100rb 🔧</h3>
                      <div className="promo-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="promo-star-icon">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="promo-slide-center">
                      <svg viewBox="0 0 400 120" style={{ width: '100%', maxHeight: '110px', display: 'block' }}>
                        {/* Pipa Premium / Elite */}
                        <rect x="60" y="45" width="280" height="18" rx="9" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
                        <rect x="65" y="49" width="270" height="10" rx="5" fill="#f59e0b" />
                        {/* Copper pipes wrapped */}
                        <path d="M 80 45 L 90 63 M 120 45 L 130 63 M 160 45 L 170 63 M 200 45 L 210 63 M 240 45 L 250 63 M 280 45 L 290 63 M 310 45 L 320 63" stroke="#ffffff" strokeWidth="2.5" opacity="0.4" />
                        {/* Tools Badge */}
                        <circle cx="200" cy="54" r="24" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                        <text x="188" y="62" fontSize="24">🛠️</text>
                      </svg>
                    </div>

                    <div className="promo-slide-right">
                      <span className="promo-hand-pointer">👉</span>
                      <div className="promo-dashed-box" onClick={() => navigator.clipboard.writeText('PASANGELITE')}>
                        PASANGELITE
                      </div>
                      <div className="promo-right-label">POTONGAN PAKET PIPA ELITE ASTM</div>
                    </div>
                  </div>

                  {/* Slide 3: Cashback Instan */}
                  <div className="promo-slide-item" style={{ background: 'linear-gradient(135deg, #0b322c 0%, #051614 100%)', color: '#ffffff' }}>
                    <div className="promo-slide-left">
                      <h3>CASHBACK 5% QRIS / TRANSFER 💳</h3>
                      <div className="promo-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="promo-star-icon">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="promo-slide-center">
                      <svg viewBox="0 0 400 120" style={{ width: '100%', maxHeight: '110px', display: 'block' }}>
                        {/* QR Code and Cards visual style */}
                        <rect x="80" y="25" width="60" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                        {/* QR pattern mock */}
                        <rect x="90" y="35" width="15" height="15" fill="#0f172a" />
                        <rect x="115" y="35" width="15" height="15" fill="#0f172a" />
                        <rect x="90" y="60" width="15" height="15" fill="#0f172a" />
                        <rect x="115" y="60" width="15" height="15" fill="#0f172a" />
                        <circle cx="110" cy="55" r="4" fill="#ef4444" />
                        
                        {/* Credit Card style visual */}
                        <rect x="230" y="35" width="90" height="54" rx="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" transform="rotate(-5, 230, 35)" />
                        <rect x="238" y="44" width="20" height="14" rx="3" fill="#facc15" transform="rotate(-5, 230, 35)" />
                        <line x1="230" y1="65" x2="310" y2="58" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="promo-slide-right">
                      <span className="promo-hand-pointer">👉</span>
                      <div className="promo-dashed-box" onClick={() => navigator.clipboard.writeText('BUNDLEHEMAT')}>
                        BUNDLEHEMAT
                      </div>
                      <div className="promo-right-label">POTONGAN HINGGA RP 150.000</div>
                    </div>
                  </div>
                </div>

                {/* Dots indicator */}
                <div className="promo-dots-indicator">
                  {[0, 1, 2].map(idx => (
                    <button
                      key={idx}
                      className={`promo-dot-node ${currentPromoSlide === idx ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPromoSlide(idx);
                        startPromoTimer();
                      }}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 5. Trust Badges Section */}
            <section className="selka-trust-badges" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '16px', 
              padding: '24px', 
              borderRadius: '24px', 
              background: 'var(--color-surface-container-high)', 
              marginBottom: '40px' 
            }}>
              {[
                { badge: '🛡️', title: '100% Original', desc: 'Unit asli bergaransi pabrik' },
                { badge: '🔧', title: 'Teknisi Certified', desc: 'Instalasi rapi & teruji' },
                { badge: '❄️', title: 'Pipa JIS Premium', desc: 'Pipa tebal anti bocor freon' },
                { badge: '✅', title: 'Garansi 30 Hari', desc: 'Jaminan dingin & bebas kendala' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '30px' }}>{item.badge}</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* 6. Brand filters list */}
            <section className="selka-brand-filters" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CARI BERDASARKAN MERK AC</h4>
                {brandFilter && <Button size="small" variant="outline" onClick={() => setBrandFilter('')}>Bersihkan Filter Brand</Button>}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
            </section>
          </div>
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
          {pkFilter && (
            <div className="active-filter-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Filter PK: {pkFilter} PK
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setPkFilter('')} />
            </div>
          )}
          {brandFilter && (
            <div className="active-filter-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              Brand: {brandFilter}
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setBrandFilter('')} />
            </div>
          )}
        </div>

        {loading ? (
          <InlineLoader text="Membuka katalog..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div className="inventory-grid" style={{ paddingBottom: '32px', width: '100%' }}>
              {filteredProducts.length > 0 ? (
                (isAdmin ? filteredProducts : filteredProducts.slice(0, 8)).map(product => (
                  <div key={product.id} style={{ position: 'relative' }}>
                    <ProductCard
                      image={product.image_url}
                      brand={product.brand}
                      name={product.name}
                      type={product.type || product.category}
                      price={formatRupiah(product.price)}
                      specs={[`${product.capacity_pk} PK`, product.stock > 0 ? 'Ready' : 'Indent']}
                      status={product.stock > 0 ? 'Tersedia' : 'Habis'}
                      onClick={() => {
                        if (user && isAdmin) {
                          navigate(`/inventory/${product.id}`);
                        } else {
                          navigate(`/product/${product.id}`);
                        }
                      }}
                    />
                    {!isAdmin && (
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            navigate('/login');
                          } else {
                            setSelectedProduct(product);
                          }
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

            {!isAdmin && (
              <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '80px', display: 'flex', justifyContent: 'center' }}>
                <Button 
                  onClick={() => navigate('/catalog')} 
                  variant="primary"
                  style={{
                    padding: '14px 40px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: '800',
                    boxShadow: '0 8px 24px rgba(0, 85, 255, 0.2)'
                  }}
                >
                  Lihat Selengkapnya & Filter AC ➜
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 📑 Footer Section (Selka.id Style) */}
        {!isAdmin && (
          <footer className="selka-footer" style={{
            marginTop: '64px',
            padding: '48px 24px 24px 24px',
            borderTop: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface-container-lowest)',
            color: 'var(--color-on-surface)',
            borderRadius: '24px 24px 0 0',
            fontSize: '13px'
          }}>
            <div className="footer-cols" style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
              gap: '32px',
              marginBottom: '32px'
            }}>
              {/* Col 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>❄️</span>
                  <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--color-primary)' }}>MITRA MAJU SEJATI</span>
                </div>
                <p style={{ fontWeight: '700', marginBottom: '12px' }}>Toko Online E-Commerce Spesialis AC #1</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ background: 'var(--color-primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>DAIKIN I-SHOP</span>
                  <span style={{ background: 'var(--color-primary-dark)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>GREE EXPERT SHOP</span>
                </div>
                <p style={{ fontWeight: '800', margin: '0 0 4px 0' }}>PT. MITRA MAJU SEJATI</p>
                <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 12px 0' }}>Melayani daerah Jabodetabek</p>
                <p style={{ margin: '0 0 4px 0' }}><strong>Mail:</strong> cs@mitramajusejati.id</p>
                <p style={{ margin: '0 0 20px 0' }}><strong>Whatsapp:</strong> 0851-7411-5770</p>
                <p style={{ fontWeight: '800', margin: '0 0 4px 0' }}>JAM LAYANAN CS</p>
                <p style={{ margin: '0 0 2px 0', color: 'var(--color-on-surface-variant)' }}>Senin - Jumat: 08.30 - 16.30</p>
                <p style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>Sabtu: 09.30 - 13.30</p>
              </div>

              {/* Col 2 */}
              <div>
                <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>RESIDENTIAL AC</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', lineHeight: '2' }}>
                  {['AC Split', 'AC Multi Split', 'Cuci AC', 'AC Portable', 'Air Curtain', 'Air Cooler'].map(item => (
                    <li key={item}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>{item}</a></li>
                  ))}
                </ul>
                <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>PROYEK AC</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
                  {['Informasi Proyek AC', 'AC Floor Standing', 'AC Cassette', 'AC Split Duct', 'AC Ceiling', 'AC VRV / VRF'].map(item => (
                    <li key={item}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>{item}</a></li>
                  ))}
                </ul>
              </div>

              {/* Col 3 */}
              <div>
                <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>INFO PERUSAHAAN</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', lineHeight: '2' }}>
                  {['Ranking AC', 'Panduan AC 2026', 'Rahasia Kami', 'Tentang Kami', 'Kontak Kami', 'Service Center', 'Syarat & Ketentuan', 'Kebijakan Privasi', 'Lowongan Kerja'].map(item => (
                    <li key={item}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>{item}</a></li>
                  ))}
                </ul>
                <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>INFO PEMESANAN</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
                  {['Toko AC Terdekat', 'Pilihan Pengiriman', 'Harga Jasa Pasang AC'].map(item => (
                    <li key={item}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>{item}</a></li>
                  ))}
                </ul>
              </div>

              {/* Col 4 */}
              <div>
                <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--color-primary)' }}>Follow Kami</h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '20px', cursor: 'pointer' }}>📸</span>
                  <span style={{ fontSize: '20px', cursor: 'pointer' }}>📺</span>
                  <span style={{ fontSize: '20px', cursor: 'pointer' }}>🎵</span>
                </div>
                <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                  MitraMajuSejati.id © Copyright © 2012-2026 website ini didevelop oleh PT. Mitra Maju Sejati
                </p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>

      {/* Customize Product Modal */}
      {selectedProduct && (
        <div className="quick-view-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="quick-view-modal fade-in-scale" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column' }}>
            <button className="quick-view-close" onClick={() => setSelectedProduct(null)} style={{ top: '16px', right: '16px' }}><X size={20} /></button>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '85vh' }}>
              <div>
                <span className="details-brand-badge">{selectedProduct.brand}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--color-on-surface)' }}>{selectedProduct.brand} AC {selectedProduct.name}</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '4px 0 0 0' }}>Kapasitas: {selectedProduct.capacity_pk} PK • {selectedProduct.stock > 0 ? 'Ready Stock' : 'Indent'}</p>
              </div>

              {/* Price Calculation preview */}
              <div style={{ background: 'var(--color-surface-container-low)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--color-outline-variant)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimasi Total Harga</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>
                    {formatRupiah(calculateProductTotalPrice(selectedProduct, purchaseType, pipeGrade, pipeLength))}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', textDecoration: 'line-through' }}>
                    {formatRupiah(Math.round(calculateProductTotalPrice(selectedProduct, purchaseType, pipeGrade, pipeLength) * 1.12))}
                  </span>
                </div>
              </div>

              {/* Purchase Type selection */}
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: '8px', letterSpacing: '0.05em' }}>Kategori Pembelian</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div 
                    onClick={() => setPurchaseType('unit')}
                    style={{
                      border: `2px solid ${purchaseType === 'unit' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                      background: purchaseType === 'unit' ? 'rgba(0, 85, 255, 0.04)' : 'var(--color-surface-container-lowest)',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '12px', color: 'var(--color-on-surface)' }}>Hanya Unit AC</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '2px', lineHeight: '1.3' }}>Tanpa material & jasa pasang.</div>
                  </div>
                  <div 
                    onClick={() => setPurchaseType('package')}
                    style={{
                      border: `2px solid ${purchaseType === 'package' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                      background: purchaseType === 'package' ? 'rgba(0, 85, 255, 0.04)' : 'var(--color-surface-container-lowest)',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '12px', color: 'var(--color-on-surface)' }}>Paket Pasang (Terima Beres)</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '2px', lineHeight: '1.3' }}>Termasuk pipa tembaga, bracket, vacuum, & jasa pasang.</div>
                  </div>
                </div>
              </div>

              {/* Pipe Grade & Length selection */}
              {purchaseType === 'package' && (
                <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: '8px', letterSpacing: '0.05em' }}>Grade Pipa Tembaga</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { val: 'basic', label: 'Basic (0.50mm)', desc: 'Ekonomis, untuk budget terbatas.' },
                        { val: 'premium', label: 'Premium (0.60mm JIS)', desc: 'Rekomendasi pabrik untuk AC R-32/Inverter.' },
                        { val: 'elite', label: 'Elite (0.76mm ASTM)', desc: 'Terbaik jika pipa tertanam di dinding/plafon.' }
                      ].map(item => (
                        <div 
                          key={item.val}
                          onClick={() => setPipeGrade(item.val)}
                          style={{
                            border: `2px solid ${pipeGrade === item.val ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: pipeGrade === item.val ? 'rgba(0, 85, 255, 0.04)' : 'var(--color-surface-container-lowest)',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: '800', fontSize: '12px', color: 'var(--color-on-surface)' }}>{item.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: '8px', letterSpacing: '0.05em' }}>Estimasi Panjang Pipa</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="stepper-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--color-surface-container-low)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--color-outline-variant)' }}>
                        <button 
                          onClick={() => setPipeLength(prev => Math.max(3, prev - 1))}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: '900', fontSize: '13px', minWidth: '20px', textAlign: 'center', color: 'var(--color-on-surface)' }}>{pipeLength}m</span>
                        <button 
                          onClick={() => setPipeLength(prev => prev + 1)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                        *Bawaan paket 3m pipa tembaga. Kelebihan meter dikenakan tarif opsional.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Button 
                  fullWidth 
                  icon={ShoppingCart} 
                  onClick={() => {
                    addToCart(selectedProduct, { purchaseType, pipeGrade, pipeLength });
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stock <= 0}
                >
                  {selectedProduct.stock > 0 ? 'Masukkan Keranjang' : 'Stok Sedang Habis'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <Navigation />
    </>
  );
};

export default Catalog;
