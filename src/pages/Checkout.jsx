import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, User, CreditCard, Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiah } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TopHeader from '../components/TopHeader';
import Button from '../components/Button';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    payment_proof_url: ''
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('arctic_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (parsedCart.length === 0) navigate('/catalog');
      setCart(parsedCart);
    } else {
      navigate('/catalog');
    }
  }, []);

  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateUniqueId()}.${fileExt}`;
      const filePath = `payments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, payment_proof_url: publicUrl });
    } catch (error) {
      toast.error('Gagal mengunggah bukti: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.payment_proof_url) {
      toast.error('Mohon lengkapi semua data dan unggah bukti transfer.');
      return;
    }

    try {
      setLoading(true);
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 1. Create Customer if doesn't exist or just record for this transaction
      // For simplicity in this demo, we'll just create a transaction record
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          total_amount: totalAmount,
          payment_method: 'Transfer Bank',
          status: 'pending_verification',
          is_online: true,
          payment_proof_url: formData.payment_proof_url,
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_address: formData.address,
          notes: null
        }])
        .select()
        .single();

      if (transError) throw transError;

      // 2. Add items to transaction_items
      const itemInserts = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemInserts);

      if (itemsError) throw itemsError;

      // 3. Success! Clear cart
      localStorage.removeItem('arctic_cart');
      setSuccess(true);
    } catch (error) {
      toast.error('Gagal memproses pesanan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="dashboard-container fade-in" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '40px' }}>
          <CheckCircle size={80} color="#008756" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Pesanan Terkirim!</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Bukti pembayaran Anda sedang diverifikasi oleh tim Admin. Kami akan segera menghubungi Anda.
          </p>
          <Button fullWidth onClick={() => navigate('/catalog')}>
            Kembali ke Katalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Checkout" subtitle="Selesaikan Pesanan Anda" />
      
      <div className="page-content" style={{ paddingBottom: '120px' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '20px' }}>
          <ChevronLeft size={24} /> Kembali
        </button>

        <section className="card-elevation" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--color-primary)" /> Informasi Pengiriman
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label>Nama Penerima</label>
              <input 
                type="text" 
                className="service-select" 
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>No. HP / WhatsApp</label>
              <input 
                type="tel" 
                className="service-select" 
                placeholder="Contoh: 0812xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Alamat Lengkap</label>
              <textarea 
                className="service-select" 
                style={{ height: '80px', padding: '12px' }}
                placeholder="Nama jalan, nomor rumah, kec, kota..."
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              ></textarea>
            </div>
          </div>
        </section>

        <section className="card-elevation mt-4" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="var(--color-primary)" /> Pembayaran Transfer
          </h3>
          <div style={{ padding: '16px', backgroundColor: '#f0f4ff', borderRadius: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#666' }}>Bank BCA</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>1234 5678 90</p>
            <p style={{ fontSize: '12px', margin: 0, color: '#666' }}>A/N PT Arctic Clarity Indonesia</p>
          </div>

          <div className="form-group">
            <label>Unggah Bukti Transfer</label>
            <label className="upload-box" style={{ 
              border: '2px dashed #ddd', 
              borderRadius: '12px', 
              padding: '30px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              cursor: 'pointer',
              backgroundColor: formData.payment_proof_url ? '#eafff5' : '#fafafa'
            }}>
              <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
              {uploading ? (
                <Loader2 className="spinner" size={24} />
              ) : formData.payment_proof_url ? (
                <>
                  <CheckCircle size={24} color="#008756" />
                  <span style={{ fontSize: '12px', color: '#008756', marginTop: '8px' }}>Bukti Berhasil Diunggah</span>
                </>
              ) : (
                <>
                  <Upload size={24} color="#999" />
                  <span style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Klik untuk pilih foto</span>
                </>
              )}
            </label>
          </div>
        </section>

        <section className="card-elevation mt-4" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Ringkasan Pesanan</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>{item.quantity}x {item.brand} {item.name}</span>
              <span>{formatRupiah(item.price * item.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Bayar</span>
            <span style={{ color: 'var(--color-primary)', fontSize: '18px' }}>{formatRupiah(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
          </div>
        </section>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'white', borderTop: '1px solid #eee', zIndex: 10 }}>
          <Button fullWidth onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
