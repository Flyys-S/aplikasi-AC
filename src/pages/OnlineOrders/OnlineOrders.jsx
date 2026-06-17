import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Eye, CheckCircle, XCircle, Clock, MapPin, Phone,
  Loader2, Image as ImageIcon, User, Truck, PackageCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatAngka, formatRupiah, formatTanggalJam } from '../../lib/formatters';
import { getStatusLabel, getOrderProgress } from '../../lib/statusUtils';
import toast from 'react-hot-toast';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import './OnlineOrders.css';

const ADMIN_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending_verification', label: 'Perlu Verifikasi' },
  { id: 'paid', label: 'Siap Kirim' },
  { id: 'shipping', label: 'Dikirim' },
  { id: 'done', label: 'Selesai' },
];

const PIPELINE_STEPS = [
  { key: 'pending_verification', label: 'Menunggu Verifikasi', color: '#f5a623' },
  { key: 'paid',                 label: 'Dibayar / Siap Kirim', color: '#1890ff' },
  { key: 'shipping',             label: 'Sedang Dikirim', color: '#7c3aed' },
  { key: 'delivered',            label: 'Sudah Sampai', color: '#059669' },
  { key: 'completed',            label: 'Selesai', color: '#008756' },
];

const OnlineOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
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
      toast.error('Gagal memuat pesanan: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus, successMsg) => {
    try {
      setProcessing(orderId);
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      toast.success(successMsg);
      fetchOrders();
    } catch (error) {
      toast.error('Gagal memperbarui: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const approvePayment = async (order) => {
    try {
      setProcessing(order.id);
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'paid' })
        .eq('id', order.id);
      if (error) throw error;
      toast.success('Pembayaran diverifikasi! Pesanan siap dikirim.');
      fetchOrders();
    } catch (error) {
      toast.error('Gagal menyetujui: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const rejectOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    await updateOrderStatus(orderId, 'cancelled', 'Pesanan dibatalkan.');
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'done') return ['delivered', 'completed'].includes(o.status);
    return o.status === activeTab;
  });

  const getTabCount = (tabId) => {
    if (tabId === 'all') return orders.length;
    if (tabId === 'done') return orders.filter(o => ['delivered', 'completed'].includes(o.status)).length;
    return orders.filter(o => o.status === tabId).length;
  };

  const MiniPipeline = ({ status }) => {
    const step = getOrderProgress(status);
    if (status === 'cancelled') return null;
    return (
      <div className="admin-mini-pipeline">
        {PIPELINE_STEPS.slice(0, 4).map((s, i) => (
          <React.Fragment key={i}>
            <div
              className={`amp-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}
              style={i <= step ? { background: s.color, borderColor: s.color } : {}}
              title={s.label}
            />
            {i < 3 && (
              <div className={`amp-line ${i < step ? 'active' : ''}`}
                style={i < step ? { background: PIPELINE_STEPS[i + 1]?.color } : {}} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const ActionButtons = ({ order }) => {
    const isProcessing = processing === order.id;
    const s = order.status;

    if (s === 'pending_verification') {
      return (
        <div className="order-actions-row">
          <Button size="small" variant="outline" icon={ImageIcon}
            onClick={() => window.open(order.payment_proof_url, '_blank')}>
            Bukti Bayar
          </Button>
          <Button size="small" variant="success"
            icon={isProcessing ? Loader2 : CheckCircle}
            onClick={() => approvePayment(order)}
            disabled={isProcessing}>
            {isProcessing ? 'Memproses...' : 'Verifikasi Bayar'}
          </Button>
          <Button size="small" variant="danger"
            onClick={() => rejectOrder(order.id)}
            disabled={isProcessing}>
            Tolak
          </Button>
        </div>
      );
    }
    if (s === 'paid') {
      return (
        <div className="order-actions-row">
          <Button size="small" variant="primary"
            icon={isProcessing ? Loader2 : Truck}
            onClick={() => updateOrderStatus(order.id, 'shipping', 'Status diubah: Sedang Dikirim!')}
            disabled={isProcessing}>
            {isProcessing ? 'Memproses...' : 'Proses Pengiriman'}
          </Button>
        </div>
      );
    }
    if (s === 'shipping') {
      return (
        <div className="order-actions-row">
          <Button size="small" variant="success"
            icon={isProcessing ? Loader2 : PackageCheck}
            onClick={() => updateOrderStatus(order.id, 'delivered', 'Pesanan dikonfirmasi telah sampai!')}
            disabled={isProcessing}>
            {isProcessing ? 'Memproses...' : 'Konfirmasi Terkirim'}
          </Button>
        </div>
      );
    }
    if (s === 'delivered') {
      return (
        <div className="order-actions-row">
          <Button size="small" variant="success"
            icon={isProcessing ? Loader2 : CheckCircle}
            onClick={() => updateOrderStatus(order.id, 'completed', 'Pesanan selesai!')}
            disabled={isProcessing}>
            {isProcessing ? 'Memproses...' : 'Tandai Selesai'}
          </Button>
        </div>
      );
    }
    if (s === 'cancelled') {
      return (
        <div className="order-actions-row">
          <span className="cancelled-note">Pesanan ini telah dibatalkan.</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      <TopHeader title="Kelola Pesanan" subtitle="Pipeline Pesanan Online" />

      <div className="page-content fade-in" style={{ paddingBottom: '100px' }}>
        {/* Tab Bar */}
        <div className="admin-orders-tabs">
          {ADMIN_TABS.map((tab) => {
            const count = getTabCount(tab.id);
            return (
              <button
                key={tab.id}
                className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {count > 0 && <span className="admin-tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <InlineLoader text="Memuat pesanan..." />
        ) : (
          <div className="order-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const statusInfo = getStatusLabel(order.status);
                const isExpanded = expandedId === order.id;

                return (
                  <div
                    key={order.id}
                    className="admin-order-card"
                    style={{
                      borderLeft: `4px solid ${statusInfo.color}`,
                    }}
                  >
                    {/* Card Header */}
                    <div
                      className="admin-order-header"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div className="admin-order-header-left">
                        <h4>Order #{order.id.slice(0, 8).toUpperCase()}</h4>
                        <p className="admin-order-time">
                          <Clock size={11} />
                          {formatTanggalJam(order.created_at)}
                        </p>
                      </div>
                      <div className="admin-order-header-right">
                        <span
                          className="status-tag"
                          style={{ backgroundColor: statusInfo.bg, color: statusInfo.color, border: 'none' }}
                        >
                          {statusInfo.label}
                        </span>
                        {isExpanded
                          ? <ChevronUp size={16} color="#9ca3af" />
                          : <ChevronDown size={16} color="#9ca3af" />}
                      </div>
                    </div>

                    {/* Mini Pipeline */}
                    <MiniPipeline status={order.status} />

                    {/* Buyer Summary (always visible) */}
                    <div className="admin-order-summary">
                      <span className="admin-buyer-name">
                        <User size={13} />
                        {order.buyer_name || order.profiles?.full_name || 'Pelanggan'}
                      </span>
                      <span className="admin-order-total">{formatRupiah(order.total_amount)}</span>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="admin-order-detail">
                        {/* Buyer Info */}
                        <div className="admin-buyer-info">
                          <div className="admin-info-row">
                            <Phone size={13} color="#9ca3af" />
                            <span>{order.buyer_phone || '-'}</span>
                          </div>
                          <div className="admin-info-row">
                            <MapPin size={13} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ flex: 1 }}>{order.buyer_address || order.notes || '-'}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="admin-items-list">
                          {order.items?.map((item) => (
                            <div key={item.id} className="admin-item-row">
                              <span>{item.quantity}x {item.products?.brand} {item.products?.name}</span>
                              <span>{formatAngka(item.subtotal)}</span>
                            </div>
                          ))}
                          <div className="admin-item-total">
                            <span>Total</span>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                              {formatRupiah(order.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <ActionButtons order={order} />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState icon={ShoppingBag} text="Tidak ada pesanan di kategori ini." />
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default OnlineOrders;
