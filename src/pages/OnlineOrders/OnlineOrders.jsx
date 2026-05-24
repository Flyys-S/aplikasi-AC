import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Eye, CheckCircle, XCircle, Clock, MapPin, Phone, Loader2, Image as ImageIcon, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatAngka, formatRupiah, formatTanggalJam } from '../../lib/formatters';
import { decrementStockBatch } from '../../lib/stockUtils';
import { getStatusLabel } from '../../lib/statusUtils';
import toast from 'react-hot-toast';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';

const OnlineOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const approveOrder = async (order) => {
    try {
      setProcessing(order.id);
      
      // 1. Update Transaction Status
      const { error: transError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', order.id);

      if (transError) throw transError;

      // 2. Subtract Stock for each item atomically via RPC
      const { success, errors } = await decrementStockBatch(order.items);
      if (!success) {
         console.error('Partial stock update failure on approval:', errors);
      }

      toast.success('Pesanan disetujui dan stok telah diperbarui!');
      fetchOrders();
    } catch (error) {
      toast.error('Gagal menyetujui: ' + error.message);
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
      toast.error('Gagal membatalkan: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Pesanan Online" subtitle="Verifikasi Bukti Pembayaran" />

      <div className="page-content" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <InlineLoader text="Memuat antrean..." />
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
                    <div className="status-tag" style={{ backgroundColor: getStatusLabel(order.status).bg, color: getStatusLabel(order.status).color, border: 'none' }}>
                      {getStatusLabel(order.status).label}
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div style={{ backgroundColor: '#f0f4ff', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={14} color="#666" /> <strong style={{ color: '#333' }}>{order.buyer_name || 'Pelanggan Online (Data Lama)'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#555' }}>
                      <Phone size={14} color="#666" /> {order.buyer_phone || '-'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#555' }}>
                      <MapPin size={14} color="#666" style={{ marginTop: '2px', flexShrink: 0 }} /> <span style={{ flex: 1, lineHeight: '1.4' }}>{order.buyer_address || order.notes || 'Tidak ada alamat terdaftar'}</span>
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
              <EmptyState icon={ShoppingBag} text="Belum ada pesanan online." />
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default OnlineOrders;

