import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Thermometer, Zap, Star, ShoppingCart, Share2, Camera, Loader2, Save, Trash2, Plus, Minus, Tag, Package, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
        navigate(`/inventory/${data[0].id}`);
      } else {
        const { error } = await supabase
          .from('products')
          .update(product)
          .eq('id', id);
        if (error) throw error;
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

