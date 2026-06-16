import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, User, CreditCard, Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TopHeader from '../../components/TopHeader';
import Button from '../../components/Button';
import { decrementStockBatch } from '../../lib/stockUtils';

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
    const timer = setTimeout(() => {
      const savedCart = localStorage.getItem('arctic_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length === 0) {
          navigate('/catalog');
        } else {
          setCart(parsedCart);
        }
      } else {
        navigate('/catalog');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [navigate]);

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

      // 1. Fetch material & service products to map their database IDs
      const { data: materialProducts, error: matError } = await supabase
        .from('products')
        .select('id, name, price, type')
        .in('name', [
          'Pipa Basic (0.50mm) - Per Meter',
          'Pipa Premium (0.60mm JIS) - Per Meter',
          'Pipa Elite (0.76mm ASTM) - Per Meter',
          'Bracket Outdoor AC',
          'Jasa Pasang Standard'
        ]);

      if (matError) throw matError;

      const materialMap = {};
      materialProducts?.forEach(p => {
        materialMap[p.name] = p.id;
      });

      // 2. Create Transaction
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

      // 3. Prepare detailed transaction items and stock updates
      const itemInserts = [];
      const stockUpdates = [];

      for (const item of cart) {
        if (item.customOpts && item.customOpts.purchaseType === 'package') {
          const { pipeGrade, pipeLength } = item.customOpts;

          // 3a. AC Unit itself (with its original price)
          itemInserts.push({
            transaction_id: transaction.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.originalPrice || item.price,
            subtotal: (item.originalPrice || item.price) * item.quantity
          });
          stockUpdates.push({ product_id: item.id, quantity: item.quantity });

          // 3b. Bracket Outdoor AC
          const bracketId = materialMap['Bracket Outdoor AC'];
          if (bracketId) {
            itemInserts.push({
              transaction_id: transaction.id,
              product_id: bracketId,
              quantity: item.quantity,
              unit_price: 75000,
              subtotal: 75000 * item.quantity
            });
            stockUpdates.push({ product_id: bracketId, quantity: item.quantity });
          }

          // 3c. Jasa Pasang Standard
          const jasaId = materialMap['Jasa Pasang Standard'];
          if (jasaId) {
            itemInserts.push({
              transaction_id: transaction.id,
              product_id: jasaId,
              quantity: item.quantity,
              unit_price: 250000,
              subtotal: 250000 * item.quantity
            });
            // Services do not have inventory tracking
          }

          // 3d. Pipa per meter
          let pipeName = '';
          let pipeBaseCost = 0;
          let pipeAddCost = 0;
          if (pipeGrade === 'basic') {
            pipeName = 'Pipa Basic (0.50mm) - Per Meter';
            pipeBaseCost = 175000;
            pipeAddCost = 100000;
          } else if (pipeGrade === 'elite') {
            pipeName = 'Pipa Elite (0.76mm ASTM) - Per Meter';
            pipeBaseCost = 625000;
            pipeAddCost = 160000;
          } else {
            pipeName = 'Pipa Premium (0.60mm JIS) - Per Meter';
            pipeBaseCost = 375000;
            pipeAddCost = 130000;
          }

          const pipeId = materialMap[pipeName];
          if (pipeId) {
            const totalPipePrice = pipeBaseCost + (pipeLength > 3 ? (pipeLength - 3) * pipeAddCost : 0);
            itemInserts.push({
              transaction_id: transaction.id,
              product_id: pipeId,
              quantity: item.quantity,
              unit_price: Math.round(totalPipePrice),
              subtotal: totalPipePrice * item.quantity
            });
            stockUpdates.push({ product_id: pipeId, quantity: pipeLength * item.quantity });
          }
        } else {
          // Unit Only
          itemInserts.push({
            transaction_id: transaction.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
          });
          stockUpdates.push({ product_id: item.id, quantity: item.quantity });
        }
      }

      // 4. Insert transaction items into DB
      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemInserts);

      if (itemsError) throw itemsError;

      // 5. Decrement stock atomically via RPC
      const { success: stockSuccess, errors: stockErrors } = await decrementStockBatch(stockUpdates);
      if (!stockSuccess) {
        console.error('Failed to decrement some stocks:', stockErrors);
      }

      // 6. Success! Clear cart
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
      <div className="dashboard-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
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
    <div className="dashboard-container">
      <TopHeader title="Checkout" subtitle="Selesaikan Pesanan Anda" />
      
      <div className="page-content fade-in" style={{ paddingBottom: '120px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <button onClick={() => navigate(-1)} className="back-btn mb-5">
          <ChevronLeft size={18} /> Kembali
        </button>

        <section className="card-elevation" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}>
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
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)' }}
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
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)' }}
              />
            </div>
            <div className="form-group">
              <label>Alamat Lengkap</label>
              <textarea 
                className="service-select" 
                style={{ height: '80px', padding: '12px', background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)' }}
                placeholder="Nama jalan, nomor rumah, kec, kota..."
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              ></textarea>
            </div>
          </div>
        </section>

        <section className="card-elevation mt-4" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="var(--color-primary)" /> Pembayaran Transfer
          </h3>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-container-low)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--color-outline-variant)' }}>
            <p style={{ fontSize: '12px', margin: '0 0 4px 0', color: 'var(--color-on-surface-variant)' }}>Bank BCA</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--color-on-surface)' }}>1234 5678 90</p>
            <p style={{ fontSize: '12px', margin: 0, color: 'var(--color-on-surface-variant)' }}>A/N PT Mitra Maju Sejati</p>
          </div>

          <div className="form-group">
            <label>Unggah Bukti Transfer</label>
            <label className="upload-box" style={{ 
              border: '2px dashed var(--color-outline-variant)', 
              borderRadius: '12px', 
              padding: '30px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              cursor: 'pointer',
              backgroundColor: formData.payment_proof_url ? 'rgba(0, 200, 120, 0.08)' : 'var(--color-surface-container-low)'
            }}>
              <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
              {uploading ? (
                <Loader2 className="spinner" size={24} />
              ) : formData.payment_proof_url ? (
                <>
                  <CheckCircle size={24} color="#008756" />
                  <span style={{ fontSize: '12px', color: '#008756', marginTop: '8px', fontWeight: '600' }}>Bukti Berhasil Diunggah</span>
                </>
              ) : (
                <>
                  <Upload size={24} color="var(--color-outline)" />
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>Klik untuk pilih foto</span>
                </>
              )}
            </label>
          </div>
        </section>

        <section className="card-elevation mt-4" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--color-on-surface)' }}>Ringkasan Pesanan</h3>
          {cart.map(item => (
            <div key={item.id || item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--color-on-surface)' }}>
              <span>{item.quantity}x {item.brand} {item.name} {item.configLabel ? `(${item.configLabel})` : ''}</span>
              <span>{formatRupiah(item.price * item.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--color-outline-variant)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-on-surface)' }}>
            <span>Total Bayar</span>
            <span style={{ color: 'var(--color-primary)', fontSize: '18px' }}>{formatRupiah(cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
          </div>
        </section>

        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '100%', 
          maxWidth: '800px', 
          padding: '16px var(--gutter)', 
          background: 'var(--color-surface-container-lowest)', 
          borderTop: '1px solid var(--color-outline-variant)', 
          zIndex: 10,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)'
        }}>
          <Button fullWidth onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

