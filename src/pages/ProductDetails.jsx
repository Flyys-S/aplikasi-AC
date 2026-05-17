import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Thermometer, Zap, Star, ShoppingCart, Share2, Camera, Loader2, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProduct();
    } else if (id === 'new') {
      setProduct({
        name: '',
        brand: '',
        capacity_pk: '1.0',
        price: 0,
        stock: 0,
        description: '',
        status: 'available',
        image_url: null
      });
      setLoading(false);
    }
  }, [id]);

  const fetchProduct = async () => {
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
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
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
      alert('Gagal mengunggah gambar: ' + error.message);
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
      alert('Data produk berhasil disimpan!');
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spinner" size={48} />
        <p style={{ marginTop: '20px', color: '#666' }}>Memuat informasi produk...</p>
      </div>
    );
  }

  return (
    <div className="product-detail-container fade-in">
      <TopHeader title={id === 'new' ? 'Tambah Produk' : 'Detail Produk'} onBack={() => navigate('/inventory')}>
        <button className="icon-btn" onClick={() => navigate('/inventory')}>
          <ArrowLeft size={20} />
        </button>
      </TopHeader>

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

        <div className="editable-info">
          <input 
            className="h1-input" 
            value={product.name} 
            onChange={(e) => setProduct({...product, name: e.target.value})}
            placeholder="Nama Produk (contoh: Inverter 1 PK)"
          />
          <input 
            className="brand-input" 
            value={product.brand} 
            onChange={(e) => setProduct({...product, brand: e.target.value})}
            placeholder="Merk (contoh: Daikin)"
          />
          <div className="price-input-wrapper">
            <span>Rp</span>
            <input 
              type="number"
              className="price-input" 
              value={product.price} 
              onChange={(e) => setProduct({...product, price: parseInt(e.target.value)})}
            />
          </div>
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
            <span className="spec-label">Stok</span>
            <input 
              type="number" 
              value={product.stock} 
              onChange={(e) => setProduct({...product, stock: parseInt(e.target.value)})}
              className="spec-input-inline"
            />
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

        <div className="action-buttons" style={{ marginTop: '30px' }}>
          <Button variant="outline" icon={Trash2} onClick={() => navigate('/inventory')}>
            Batal
          </Button>
          <Button icon={Save} onClick={handleSave}>
            Simpan Produk
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProductDetails;
