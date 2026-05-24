import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Loader2, User, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatAngka, formatRupiah } from '../../lib/formatters';
import { decrementStockBatch } from '../../lib/stockUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TopHeader from '../../components/TopHeader';
import Button from '../../components/Button';
import './NewTransaction.css';

const NewTransaction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod] = useState('Tunai');
  const [notes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        supabase.from('products').select('*').order('brand'),
        supabase.from('customers').select('*').order('name')
      ]);

      if (prodRes.error) throw prodRes.error;
      if (custRes.error) throw custRes.error;

      setProducts(prodRes.data || []);
      setCustomers(custRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInitialData]);

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.stock <= 0) {
      toast.error('Stok tidak mencukupi!');
      return;
    }

    if (currentQtyInCart >= product.stock) {
      toast.error('Stok tidak mencukupi!');
      return;
    }

    if (existing) {
      setCart(cart.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
        : i));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        name: product.name, 
        brand: product.brand,
        unit_price: product.price, 
        quantity: 1, 
        subtotal: product.price,
        stock: product.stock
      }]);
    }
  };

  const updateQty = (productId, delta) => {
    const item = cart.find(i => i.product_id === productId);
    
    if (delta > 0 && item.quantity >= item.stock) {
      toast.error('Stok maksimal tercapai');
      return;
    }

    setCart(cart.map(i => i.product_id === productId
      ? { ...i, quantity: Math.max(0, i.quantity + delta), subtotal: Math.max(0, i.quantity + delta) * i.unit_price }
      : i).filter(i => i.quantity > 0));
  };

  const total = cart.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!window.confirm('Simpan transaksi ini? Stok akan langsung terpotong.')) return;

    try {
      setSaving(true);

      // 1. Double check stock for each item before proceeding
      for (const item of cart) {
        const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (p.stock < item.quantity) {
          throw new Error(`Stok ${item.brand} ${item.name} tidak cukup (Tersisa: ${p.stock})`);
        }
      }

      // 2. Create Transaction
      const { data: txn, error: txnError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          customer_id: selectedCustomer || null,
          total_amount: total,
          payment_method: paymentMethod,
          status: 'completed',
          is_online: false,
          notes: notes
        }])
        .select()
        .single();

      if (txnError) throw txnError;

      // 3. Add Items & Update Stock
      const itemsPayload = cart.map(item => ({
        transaction_id: txn.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase.from('transaction_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      // 4. Update Stock Atomically via RPC
      const { success: stockSuccess, errors } = await decrementStockBatch(cart);
      if (!stockSuccess) {
        console.error('Partial stock update failure:', errors);
      }

      setCart([]);
      toast.success('Transaksi berhasil disimpan!');
      navigate(`/transactions/${txn.id}`);
    } catch (error) {
      console.error('Transaction error:', error.message);
      toast.error('Gagal: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <TopHeader title="Transaksi Baru" subtitle="Input Penjualan Langsung" />

      <div className="page-content fade-in" style={{ paddingBottom: '120px' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={24} /> Kembali
        </button>

        <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
          {/* Left Side: Product Selection */}
          <div className="pos-main">
            <section className="card-elevation" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', marginBottom: '20px' }}>
              <div className="search-input-wrapper" style={{ marginBottom: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '0 12px' }}>
                <Search size={18} color="#999" />
                <input 
                  type="text" 
                  placeholder="Cari AC berdasarkan merk atau tipe..." 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ border: 'none', background: 'none', padding: '12px', width: '100%', outline: 'none' }}
                />
              </div>

              <div className="pos-product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className={`pos-product-card card-elevation ${product.stock <= 0 ? 'disabled' : ''}`}
                    onClick={() => product.stock > 0 && addToCart(product)}
                    style={{ padding: '12px', borderRadius: '12px', backgroundColor: product.stock <= 0 ? '#f5f5f5' : 'white', cursor: product.stock <= 0 ? 'not-allowed' : 'pointer', border: '2px solid transparent' }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'block' }}>{product.brand}</span>
                    <span style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>{product.name}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{product.stock} pcs</span>
                      <Plus size={16} color={product.stock > 0 ? 'var(--color-primary)' : '#ccc'} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Side: Cart & Details */}
          <div className="pos-sidebar">
            <section className="card-elevation" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', height: 'fit-content' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--color-primary)" /> Informasi Pelanggan
              </h3>
              <select 
                className="service-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                style={{ marginBottom: '20px' }}
              >
                <option value="">Pelanggan Umum (Walk-in)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>

              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Detail Pesanan</h3>
              <div className="pos-cart" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {cart.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Belum ada item dipilih.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.brand} {item.name}</span>
                        <button onClick={() => setCart(cart.filter(i => i.product_id !== item.product_id))} style={{ border: 'none', background: 'none', color: '#ff4444' }}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateQty(item.product_id, -1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: 'none' }}><Minus size={12} /></button>
                          <span style={{ fontSize: '14px' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: 'none' }}><Plus size={12} /></button>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{formatAngka(item.subtotal)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '18px' }}>{formatRupiah(total)}</span>
                </div>
              </div>

              <Button fullWidth onClick={handleSubmit} disabled={saving || cart.length === 0} icon={saving ? Loader2 : ShoppingCart}>
                {saving ? 'Menyimpan...' : 'Bayar Sekarang'}
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTransaction;

