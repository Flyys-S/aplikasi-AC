import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, CheckCircle, XCircle, Clock, MapPin, Phone, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatAngka, formatRupiah, formatTanggalJam } from '../lib/formatters';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import Button from '../components/Button';

const OnlineOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id(full_name, email),
          items:transaction_items(
            *,
            products(name, brand)
          )
        `)
        .eq('is_online', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching online orders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (order) => {
    try {
      setProcessing(order.id);
      
      // 1. Update Transaction Status
      const { error: transError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', order.id);

      if (transError) throw transError;

      // 2. Subtract Stock for each item
      for (const item of order.items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        const newStock = Math.max(0, product.stock - item.quantity);
        
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);
      }

      alert('Pesanan disetujui dan stok telah diperbarui!');
      fetchOrders();
    } catch (error) {
      alert('Gagal menyetujui: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const rejectOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    try {
      setProcessing(orderId);
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Gagal membatalkan: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Pesanan Online" subtitle="Verifikasi Bukti Pembayaran" />

      <div className="page-content" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={32} />
            <p>Memuat antrean...</p>
          </div>
        ) : (
          <div className="order-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.length > 0 ? (
              orders.map(order => (
                <div key={order.id} className="card-elevation" style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'white', borderLeft: order.status === 'pending_verification' ? '4px solid #f5a623' : order.status === 'completed' ? '4px solid #008756' : '4px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>Order #{order.id.slice(0, 8)}</h4>
                      <p className="time" style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                        <Clock size={12} className="inline-icon" /> {formatTanggalJam(order.created_at)}
                      </p>
                    </div>
                    <div className={`status-tag ${order.status === 'completed' ? 'tag-success' : order.status === 'pending_verification' ? 'tag-pending' : 'tag-error'}`}>
                      {order.status === 'completed' ? 'Terverifikasi' : order.status === 'pending_verification' ? 'Menunggu' : 'Dibatalkan'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                    {order.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{item.quantity}x {item.products?.brand} {item.products?.name}</span>
                        <span style={{ fontWeight: '500' }}>{formatAngka(item.subtotal)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #ddd', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatRupiah(order.total_amount)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button size="small" variant="outline" icon={ImageIcon} onClick={() => window.open(order.payment_proof_url, '_blank')}>
                      Lihat Bukti
                    </Button>
                    
                    {order.status === 'pending_verification' && (
                      <>
                        <Button 
                          size="small" 
                          variant="success" 
                          icon={processing === order.id ? Loader2 : CheckCircle} 
                          onClick={() => approveOrder(order)}
                          disabled={processing === order.id}
                        >
                          {processing === order.id ? 'Memproses...' : 'Setujui'}
                        </Button>
                        <Button 
                          size="small" 
                          variant="outline" 
                          style={{ color: '#ff4444', borderColor: '#ff4444' }}
                          onClick={() => rejectOrder(order.id)}
                          disabled={processing === order.id}
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Belum ada pesanan online.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default OnlineOrders;
