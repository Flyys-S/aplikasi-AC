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

const Catalog = () => {
  const navigate = useNavigate();
  const { user, isAdmin, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // PK Calculator State
  const [roomLength, setRoomLength] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [calcBtu, setCalcBtu] = useState(null);
  const [recommendedPK, setRecommendedPK] = useState('');
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
      setPurchaseType('package');
      setPipeGrade('premium');
      setPipeLength(3);
    }
  }, [selectedProduct]);

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
  };

  const clearCalculator = () => {
    setRoomLength('');
    setRoomWidth('');
    setCalcBtu(null);
    setRecommendedPK('');
    setPkFilter('');
  };

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

  const isVisitor = role === 'visitor';

  return (
    <div className={`dashboard-container ${(!user || !isVisitor) ? 'guest-layout' : ''}`}>
      <header className="catalog-header glass-panel fade-in">
        <div className="catalog-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && isVisitor && (
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
      {/* Guest & User Customize View Modal */}
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
                
                {/* Visual spec breakdown */}
                <div className="details-specs-section" style={{ width: '100%', marginTop: '20px' }}>
                  <h3>Spesifikasi AC</h3>
                  <div className="specs-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '0' }}>
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
              
              <div className="quick-view-details-pane" style={{ borderLeft: '1px solid var(--color-outline-variant)' }}>
                <span className="details-brand-badge">{selectedProduct.brand}</span>
                <h2 className="details-title">{selectedProduct.name}</h2>
                
                {/* 🏷️ Tipe Pembelian Selection */}
                <div className="purchase-type-section" style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>TIPE PEMBELIAN</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div 
                      onClick={() => setPurchaseType('unit')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '16px',
                        border: `2px solid ${purchaseType === 'unit' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        background: purchaseType === 'unit' ? 'rgba(0, 85, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '13px' }}>Unit Saja</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Hanya mengirimkan unit AC (Indoor & Outdoor)</div>
                    </div>
                    <div 
                      onClick={() => setPurchaseType('package')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '16px',
                        border: `2px solid ${purchaseType === 'package' ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        background: purchaseType === 'package' ? 'rgba(0, 85, 255, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Berikut Paket Pasang</div>
                        <span style={{ fontSize: '9px', background: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Rekomendasi</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Sudah termasuk Jasa Pasang, Pipa 3m, Bracket, Kabel & Duct tape</div>
                    </div>
                  </div>
                </div>

                {/* 🛠️ Paket Material Selection (hanya jika memilih paket pasang) */}
                {purchaseType === 'package' && (
                  <div className="package-material-section animate-slide-down" style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>KUALITAS PIPA TEMBAGA (MATERIAL GRADE)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'basic', title: 'Grade Basic (+ Rp 500rb)', details: 'Tebal 0.50mm. Cocok untuk AC standard non-inverter.' },
                        { key: 'premium', title: 'Grade Premium (+ Rp 700rb)', details: 'Tebal 0.60mm (Standard JIS). Sangat direkomendasikan untuk AC Inverter/R32.' },
                        { key: 'elite', title: 'Grade Elite (+ Rp 950rb)', details: 'Tebal 0.76mm (Standard ASTM). Terbaik jika pipa ditanam dalam dinding/plafon.' }
                      ].map(gradeOpt => (
                        <div 
                          key={gradeOpt.key}
                          onClick={() => setPipeGrade(gradeOpt.key)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: `1px solid ${pipeGrade === gradeOpt.key ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: pipeGrade === gradeOpt.key ? 'rgba(0, 85, 255, 0.03)' : 'var(--color-surface-container-lowest)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: pipeGrade === gradeOpt.key ? 'var(--color-primary)' : 'inherit' }}>{gradeOpt.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>{gradeOpt.details}</div>
                          </div>
                          <input type="radio" checked={pipeGrade === gradeOpt.key} readOnly style={{ accentColor: 'var(--color-primary)' }} />
                        </div>
                      ))}
                    </div>

                    {/* 📏 Pipe Length Customization */}
                    <div className="pipe-length-customizer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-container-low)', padding: '12px 16px', borderRadius: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '12px' }}>Panjang Pipa</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                          Bawaan paket: 3 meter. {pipeLength > 3 ? `Tambahan ${pipeLength - 3}m (+ ${formatRupiah((pipeLength - 3) * getPackageCosts(pipeGrade).perMeter)})` : 'Pas 3 meter.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          onClick={() => setPipeLength(Math.max(3, pipeLength - 1))}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>{pipeLength} m</span>
                        <button 
                          onClick={() => setPipeLength(Math.min(15, pipeLength + 1))}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💰 Live Price Summary */}
                <div className="price-summary-box" style={{ 
                  background: 'var(--color-surface-container-lowest)', 
                  border: '1px solid var(--color-outline-variant)', 
                  padding: '16px', 
                  borderRadius: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '6px' }}>
                    <span>Harga Unit AC</span>
                    <span>{formatRupiah(selectedProduct.price)}</span>
                  </div>
                  {purchaseType === 'package' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '6px' }}>
                        <span>Paket Pemasangan ({pipeGrade.toUpperCase()} 3m)</span>
                        <span>{formatRupiah(getPackageCosts(pipeGrade).base)}</span>
                      </div>
                      {pipeLength > 3 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '6px' }}>
                          <span>Tambahan Pipa ({pipeLength - 3} meter)</span>
                          <span>{formatRupiah((pipeLength - 3) * getPackageCosts(pipeGrade).perMeter)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--color-outline-variant)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>Total Estimasi</span>
                    <span style={{ fontWeight: '900', fontSize: '20px', color: 'var(--color-primary)' }}>
                      {formatRupiah(calculateProductTotalPrice(selectedProduct, purchaseType, pipeGrade, pipeLength))}
                    </span>
                  </div>
                </div>

                <div className="details-cta-section" style={{ paddingTop: '0', border: 'none' }}>
                  {user ? (
                    <Button
                      fullWidth
                      onClick={() => {
                        addToCart(selectedProduct, { purchaseType, pipeGrade, pipeLength });
                        setSelectedProduct(null);
                      }}
                    >
                      Masukkan Konsep Ke Keranjang
                    </Button>
                  ) : (
                    <>
                      <p style={{ textAlign: 'center' }}>Anda harus masuk ke sistem untuk melakukan pemesanan dan menjadwalkan instalasi AC.</p>
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
