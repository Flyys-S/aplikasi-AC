import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Thermometer, Zap, Star, ShoppingCart, Share2, Camera, Loader2, Save, Trash2, Plus, Minus, Tag, Package, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { logAdminActivity } from '../../lib/activityLog';
import toast from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import InputField from '../../components/InputField';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user, role } = useAuth();

  const [purchaseType, setPurchaseType] = useState('package');
  const [pipeGrade, setPipeGrade] = useState('premium');
  const [pipeLength, setPipeLength] = useState(3);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('arctic_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('arctic_cart', JSON.stringify(cart));
  }, [cart]);

  const getPackageCosts = (grade) => {
    switch (grade) {
      case 'basic':
        return { base: 500000, perMeter: 100000, desc: 'Pipa Basic (0.50mm)' };
      case 'elite':
        return { base: 950000, perMeter: 160000, desc: 'Pipa Elite (0.76mm ASTM)' };
      case 'premium':
      default:
        return { base: 700000, perMeter: 130000, desc: 'Pipa Premium (0.60mm JIS)' };
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

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk menambahkan ke keranjang.');
      navigate('/login');
      return;
    }

    const cartItemId = purchaseType === 'package'
      ? `${product.id}-package-${pipeGrade}-${pipeLength}`
      : `${product.id}-unit`;

    const finalPrice = calculateProductTotalPrice(product, purchaseType, pipeGrade, pipeLength);
    const configLabel = purchaseType === 'package'
      ? `Paket Pasang ${pipeGrade.toUpperCase()} (${pipeLength}m)`
      : `Unit Saja`;

    const existing = cart.find(item => item.cartItemId === cartItemId);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cart, {
        ...product,
        cartItemId,
        configLabel,
        price: finalPrice,
        originalPrice: product.price,
        quantity: 1,
        customOpts: { purchaseType, pipeGrade, pipeLength }
      }];
    }
    setCart(updatedCart);
    toast.success('Produk berhasil ditambahkan ke keranjang!');
  };
  const [product, setProduct] = useState(() => {
    if (id === 'new') {
      return {
        name: '',
        brand: '',
        capacity_pk: '1.0',
        price: 0,
        stock: 0,
        description: '',
        status: 'available',
        image_url: null
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(id !== 'new');
  const [uploading, setUploading] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error.message);
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id && id !== 'new') {
      const timer = setTimeout(() => {
        fetchProduct();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [id, fetchProduct]);

  useEffect(() => {
    if (!isAdmin && id === 'new') {
      toast.error('Akses ditolak: Hanya admin yang dapat menambah produk baru.');
      navigate('/inventory');
    }
  }, [isAdmin, id, navigate]);

  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${generateUniqueId()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update local state and DB
      setProduct({ ...product, image_url: publicUrl });
      
      if (id !== 'new') {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', id);
        
        if (updateError) throw updateError;
        await logAdminActivity('UPDATE_PRODUCT', `Admin memperbarui gambar produk: ${product.brand} - ${product.name}`, { id, image_url: publicUrl });
      }
    } catch (error) {
      toast.error('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (id === 'new') {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select();
        if (error) throw error;
        await logAdminActivity('CREATE_PRODUCT', `Admin menambahkan produk baru: ${product.brand} - ${product.name}`, data[0]);
        navigate(`/inventory/${data[0].id}`);
      } else {
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', id);
        if (error) throw error;
        await logAdminActivity('UPDATE_PRODUCT', `Admin memperbarui informasi/stok produk: ${product.brand} - ${product.name}`, product);
        fetchProduct();
      }
      toast.success('Data produk berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="Memuat informasi produk..." />;
  }

  if (!isAdmin) {
    const calculatedPrice = calculateProductTotalPrice(product, purchaseType, pipeGrade, pipeLength);
    const estimatedBtu = product.capacity_pk ? Math.round(parseFloat(product.capacity_pk) * 9000) : 9000;
    const isMulti = product.type?.toLowerCase().includes('multi') || product.name?.toLowerCase().includes('multi');
    const connectionLabel = isMulti ? '2 Koneksi (Multi Split)' : '1 Koneksi (Single Split)';

    const isVisitorOrGuest = !user || role === 'visitor';
    const hasNormalSidebar = role === 'admin' || role === 'technician';
    const containerClass = hasNormalSidebar ? '' : (isVisitorOrGuest ? ' customer-layout' : ' guest-layout');

    return (
      <div className={`dashboard-container product-detail-container fade-in ${containerClass}`}>
        <TopHeader title="Detail Produk" onBack={() => navigate('/catalog')}>
          <button className="icon-btn" onClick={() => navigate('/catalog')}>
            <ArrowLeft size={20} />
          </button>
        </TopHeader>

        <div className="page-content" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
          <div className="product-detail-grid">
            
            {/* LEFT COLUMN: Gallery & Specs Table */}
            <div className="details-left-pane">
              <div className="details-image-card">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="hero-placeholder">
                    <Thermometer size={64} strokeWidth={1} color="var(--color-primary)" />
                    <span>Tidak ada gambar</span>
                  </div>
                )}
              </div>

              {/* Specs Table Card */}
              <div className="details-specs-card card-elevation">
                <h3>Spesifikasi Unit</h3>
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td className="label">Merk AC</td>
                      <td className="value">{product.brand || 'TBA'}</td>
                    </tr>
                    <tr>
                      <td className="label">Kapasitas PK</td>
                      <td className="value">{product.capacity_pk} PK</td>
                    </tr>
                    <tr>
                      <td className="label">Daya Dingin (BTU)</td>
                      <td className="value">{estimatedBtu} BTU/h</td>
                    </tr>
                    <tr>
                      <td className="label">Konsumsi Daya</td>
                      <td className="value">{product.power_watt || 'TBA'} W</td>
                    </tr>
                    <tr>
                      <td className="label">Tipe Teknologi</td>
                      <td className="value" style={{ textTransform: 'capitalize' }}>
                        {product.type || product.category || 'Standard Split'}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Koneksi</td>
                      <td className="value">{connectionLabel}</td>
                    </tr>
                    <tr>
                      <td className="label">Refrigerant</td>
                      <td className="value">R-32 (Eco Friendly)</td>
                    </tr>
                    <tr>
                      <td className="label">Garansi Resmi</td>
                      <td className="value">Sparepart 1 Thn, Kompresor 3 Thn</td>
                    </tr>
                    <tr>
                      <td className="label">Status Stok</td>
                      <td className="value" style={{ color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                        {product.stock > 0 ? `Ready Stock (${product.stock} Unit)` : 'Indent / Habis'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: Details & Configurator */}
            <div className="details-right-pane">
              <div>
                <span className="details-brand-badge">{product.brand}</span>
                <h1 className="details-main-title">{product.brand?.toUpperCase()} AC {product.name?.toUpperCase()}</h1>
                <div className="details-rating-row">
                  <div className="details-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#facc15" color="#facc15" />
                    ))}
                    <span style={{ fontWeight: '700', color: 'var(--color-on-surface)', marginLeft: '4px' }}>5.0</span>
                  </div>
                  <span>•</span>
                  <span>Ulasan Realtime</span>
                </div>
              </div>

              {/* Price Row */}
              <div className="details-price-card card-elevation">
                <span className="spec-label" style={{ fontSize: '11px' }}>HARGA ESTIMASI TOTAL</span>
                <div className="details-price-row">
                  <span className="details-price-box">{formatRupiah(calculatedPrice)}</span>
                  <span className="details-price-original">
                    {formatRupiah(Math.round(calculatedPrice * 1.12))}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                  *Termasuk PPN 11%, estimasi paket pemasangan sesuai opsi yang Anda pilih.
                </div>
              </div>

              {/* Configurator 1: Beli Unit vs Paket */}
              <div className="configurator-section">
                <h3 className="spec-label">Pilih Kategori Pembelian</h3>
                <div className="config-card-grid">
                  <div 
                    className={`config-card ${purchaseType === 'unit' ? 'active' : ''}`}
                    onClick={() => setPurchaseType('unit')}
                  >
                    <div className="config-card-title">Hanya Unit AC</div>
                    <div className="config-card-desc">Hanya unit AC indoor & outdoor saja. Tanpa material & jasa pasang.</div>
                  </div>
                  <div 
                    className={`config-card ${purchaseType === 'package' ? 'active' : ''}`}
                    onClick={() => setPurchaseType('package')}
                  >
                    <div className="config-card-title">Paket Pasang (Terima Beres)</div>
                    <div className="config-card-desc">Termasuk pipa tembaga, kabel, bracket outdoor, vacuum, & jasa instalasi bergaransi.</div>
                  </div>
                </div>
              </div>

              {/* Configurator 2: Grade Pipa Tembaga */}
              {purchaseType === 'package' && (
                <div className="configurator-section animate-slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 className="spec-label">Pilih Grade Pipa Tembaga</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { val: 'basic', label: 'Basic Grade (Tebal 0.50mm)', desc: 'Ekonomis, direkomendasikan untuk low-budget.' },
                      { val: 'premium', label: 'Premium Grade (Tebal 0.60mm JIS)', desc: 'Ketebalan standar Inverter, direkomendasikan untuk performa optimal.' },
                      { val: 'elite', label: 'Elite Grade (Tebal 0.76mm ASTM)', desc: 'Sangat kokoh & awet, terbaik jika pipa masuk ke dalam dinding/plafon.' }
                    ].map(item => (
                      <div 
                        key={item.val}
                        className={`config-card ${pipeGrade === item.val ? 'active' : ''}`}
                        onClick={() => setPipeGrade(item.val)}
                      >
                        <div className="config-card-title">{item.label}</div>
                        <div className="config-card-desc">{item.desc}</div>
                      </div>
                    ))}
                  </div>

                  <h3 className="spec-label" style={{ marginTop: '8px' }}>Estimasikan Panjang Pipa</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="stepper-container">
                      <button 
                        onClick={() => setPipeLength(prev => Math.max(3, prev - 1))}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-on-surface)' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontWeight: '900', fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>{pipeLength}m</span>
                      <button 
                        onClick={() => setPipeLength(prev => prev + 1)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-on-surface)' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', lineHeight: '1.4' }}>
                      *Bawaan paket adalah 3 meter pipa tembaga.<br />Penambahan dikenakan tarif per meter.
                    </span>
                  </div>
                </div>
              )}

              {/* Action CTA Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button 
                  fullWidth 
                  icon={ShoppingCart} 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0 ? 'Masukkan Keranjang' : 'Stok Sedang Habis'}
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Kembali
                </Button>
              </div>

              {/* Description Card */}
              <div className="details-desc-card card-elevation">
                <h3>Deskripsi Produk</h3>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.7', color: 'var(--color-on-surface-variant)', whiteSpace: 'pre-wrap' }}>
                  {product.description || 'Tidak ada deskripsi tambahan untuk produk pendingin ruangan ini.'}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="trust-badges-grid">
                <div className="trust-badge-item card-elevation" style={{ background: 'rgba(0, 85, 255, 0.03)' }}>
                  <span style={{ fontSize: '24px' }}>🛡️</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '12px' }}>Garansi 100% Asli</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>Garansi resmi produsen langsung</div>
                  </div>
                </div>
                <div className="trust-badge-item card-elevation" style={{ background: 'rgba(16, 185, 129, 0.03)' }}>
                  <span style={{ fontSize: '24px' }}>🔧</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '12px' }}>Jasa Pasang Pro</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>Teknisi bersertifikasi & vacuum rapi</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <Navigation />
      </div>
    );
  }

  return (
    <div className="dashboard-container product-detail-container fade-in">
      <TopHeader title={id === 'new' ? 'Tambah Produk' : 'Detail Produk'} onBack={() => navigate('/inventory')}>
        <button className="icon-btn" onClick={() => navigate('/inventory')}>
          <ArrowLeft size={20} />
        </button>
      </TopHeader>

      <div className="page-content" style={{ overflowY: 'auto', paddingBottom: '40px' }}>
        <div className="product-hero">
        <div className="product-hero-image" style={{ position: 'relative' }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="hero-placeholder">
              <Thermometer size={64} strokeWidth={1} color="var(--color-primary)" />
              <span>Belum ada gambar</span>
            </div>
          )}
          <label className="upload-btn-overlay card-elevation" style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? <Loader2 className="spinner" size={20} /> : <Camera size={20} color="var(--color-primary)" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="product-detail-body">
        <div className="product-detail-header">
          <StatusChip 
            status={product.stock > 0 ? 'Tersedia' : 'Habis'} 
            type={product.stock > 0 ? 'success' : 'error'} 
          />
          <div className="rating-row">
            <Star size={14} fill="#F5A623" stroke="#F5A623" />
            <span>Unit Baru</span>
          </div>
        </div>

        <div className="editable-info card-elevation" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--color-on-surface)' }}>Informasi Utama Produk</h3>
          
          <InputField 
            label="Nama Produk"
            placeholder="Contoh: Inverter 1 PK, Standard AC, dll."
            value={product.name || ''}
            onChange={(e) => setProduct({...product, name: e.target.value})}
            icon={Tag}
          />
          
          <InputField 
            label="Merk"
            placeholder="Contoh: Daikin, Panasonic, Sharp, dll."
            value={product.brand || ''}
            onChange={(e) => setProduct({...product, brand: e.target.value})}
            icon={Package}
          />
          
          <InputField 
            label="Harga Retail (Rupiah)"
            type="number"
            placeholder="Masukkan harga dalam rupiah"
            value={product.price || ''}
            onChange={(e) => setProduct({...product, price: parseInt(e.target.value) || 0})}
            icon={DollarSign}
          />
        </div>

        <div className="spec-grid">
          <div className="spec-item card-elevation">
            <Thermometer size={20} className="spec-icon-main" />
            <span className="spec-label">Kapasitas</span>
            <select 
              value={product.capacity_pk} 
              onChange={(e) => setProduct({...product, capacity_pk: e.target.value})}
              className="spec-select"
            >
              <option value="0.5">0.5 PK</option>
              <option value="1.0">1.0 PK</option>
              <option value="1.5">1.5 PK</option>
              <option value="2.0">2.0 PK</option>
            </select>
          </div>
          <div className="spec-item card-elevation">
            <Zap size={20} className="spec-icon-main" />
            <span className="spec-label">Stok Saat Ini</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '4px' }}>
              {product.stock || 0} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-on-surface-variant)' }}>unit</span>
            </span>
          </div>
        </div>

        <div className="product-description card-elevation" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} className="spec-icon-main" /> Kelola & Tambah Stok
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
            Gunakan tombol di bawah untuk menambah atau mengurangi jumlah stok secara cepat dan presisi.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
            {/* Step adjustment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-container-low)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)' }}>
              <button 
                type="button" 
                className="qty-btn" 
                onClick={() => setProduct(prev => ({ ...prev, stock: Math.max(0, (prev.stock || 0) - 1) }))}
                style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Minus size={14} />
              </button>
              
              <input 
                type="number" 
                value={product.stock || 0} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setProduct(prev => ({ ...prev, stock: isNaN(val) ? 0 : Math.max(0, val) }));
                }}
                className="spec-input-inline"
                style={{ 
                  textAlign: 'center', 
                  fontWeight: '800', 
                  fontSize: '18px', 
                  width: '60px', 
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: 'var(--color-on-surface)' 
                }}
              />
              
              <button 
                type="button" 
                className="qty-btn" 
                onClick={() => setProduct(prev => ({ ...prev, stock: (prev.stock || 0) + 1 }))}
                style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Quick add triggers */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setProduct(prev => ({ ...prev, stock: (prev.stock || 0) + 5 }))}
                style={{ fontSize: '13px', padding: '0 12px', height: '36px', width: 'auto', borderRadius: '8px', fontWeight: '600' }}
              >
                +5
              </button>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setProduct(prev => ({ ...prev, stock: (prev.stock || 0) + 10 }))}
                style={{ fontSize: '13px', padding: '0 12px', height: '36px', width: 'auto', borderRadius: '8px', fontWeight: '600' }}
              >
                +10
              </button>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setProduct(prev => ({ ...prev, stock: (prev.stock || 0) + 50 }))}
                style={{ fontSize: '13px', padding: '0 12px', height: '36px', width: 'auto', borderRadius: '8px', fontWeight: '600' }}
              >
                +50
              </button>
            </div>
          </div>
        </div>

        <div className="product-description card-elevation">
          <h3>Deskripsi</h3>
          <textarea 
            value={product.description} 
            onChange={(e) => setProduct({...product, description: e.target.value})}
            placeholder="Masukkan deskripsi produk..."
            rows={4}
          />
        </div>

        <div className="action-buttons" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <Button variant="outline" icon={Trash2} onClick={() => navigate('/inventory')} style={{ flex: 1 }}>
            Batal
          </Button>
          <Button icon={Save} onClick={handleSave} style={{ flex: 1 }}>
            Simpan Produk
          </Button>
        </div>
      </div>
      </div>

      <Navigation />
    </div>
  );
};

export default ProductDetails;

