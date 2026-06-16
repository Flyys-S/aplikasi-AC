import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Clock, ChevronRight, PackageSearch,
  AlertCircle, Truck, CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggalJam } from '../../lib/formatters';
import { getStatusLabel, getOrderProgress } from '../../lib/statusUtils';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import InlineLoader from '../../components/InlineLoader';
import './MyOrders.css';

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Perlu Dibayar' },
  { id: 'shipping', label: 'Untuk Dikirim' },
];

const TRACKING_STEPS = [
  { label: 'Pesanan Dibuat', icon: ShoppingBag },
  { label: 'Menunggu Kurir', icon: Clock },
  { label: 'Pesanan Dikirim', icon: Truck },
  { label: 'Pesanan Sampai', icon: CheckCircle2 },
];

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
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
        .eq('user_id', user.id)
        .eq('is_online', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'unpaid') return o.status === 'pending_verification';
    if (activeTab === 'shipping') return ['paid', 'shipping', 'delivered'].includes(o.status);
    return true;
  });

  const getTabCount = (tabId) => {
    if (tabId === 'all') return orders.length;
    if (tabId === 'unpaid') return orders.filter(o => o.status === 'pending_verification').length;
    if (tabId === 'shipping') return orders.filter(o => ['paid', 'shipping', 'delivered'].includes(o.status)).length;
    return 0;
  };

  const getOrderIcon = (status) => {
    if (status === 'cancelled') return <XCircle size={18} color="#ff4444" />;
    if (status === 'completed' || status === 'delivered') return <CheckCircle2 size={18} color="#008756" />;
    if (status === 'shipping') return <Truck size={18} color="#7c3aed" />;
    if (status === 'paid') return <Clock size={18} color="#1890ff" />;
    return <AlertCircle size={18} color="#f5a623" />;
  };

  const MiniStepper = ({ status }) => {
    const step = getOrderProgress(status);
    if (status === 'cancelled') return null;

    return (
      <div className="mini-stepper">
        {TRACKING_STEPS.map((s, i) => (
          <div key={i} className={`mini-step ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}>
            <div className="mini-step-dot" />
            {i < TRACKING_STEPS.length - 1 && <div className="mini-step-line" />}
          </div>
        ))}
        <span className="mini-step-label">{TRACKING_STEPS[Math.max(0, step)]?.label}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <TopHeader title="Pesanan Saya" subtitle="Riwayat & Status Pesanan" />

      <div className="page-content fade-in" style={{ paddingBottom: '100px' }}>
        {/* Tab Filter */}
        <div className="orders-tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`orders-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {getTabCount(tab.id) > 0 && (
                <span className="orders-tab-badge">{getTabCount(tab.id)}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <InlineLoader text="Memuat pesanan..." />
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <PackageSearch size={56} color="var(--color-primary)" style={{ opacity: 0.4 }} />
            <p>
              {activeTab === 'unpaid'
                ? 'Tidak ada pesanan yang perlu dibayar.'
                : activeTab === 'shipping'
                ? 'Tidak ada pesanan yang sedang dikirim.'
                : 'Belum ada pesanan. Yuk belanja!'}
            </p>
            {activeTab === 'all' && (
              <button className="orders-shop-btn" onClick={() => navigate('/catalog')}>
                Lihat Katalog
              </button>
            )}
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const status = getStatusLabel(order.status);
              const firstItem = order.items?.[0];
              const totalItems = order.items?.length || 0;

              return (
                <div
                  key={order.id}
                  className="order-card"
                  onClick={() => navigate(`/my-orders/${order.id}`)}
                >
                  {/* Header */}
                  <div className="order-card-header">
                    <div className="order-card-icon">
                      {getOrderIcon(order.status)}
                    </div>
                    <div className="order-card-meta">
                      <span className="order-card-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="order-card-date">
                        <Clock size={11} />
                        {formatTanggalJam(order.created_at)}
                      </span>
                    </div>
                    <span
                      className="order-status-badge"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Product Summary */}
                  <div className="order-card-products">
                    <span className="order-product-name">
                      {firstItem
                        ? `${firstItem.products?.brand || ''} ${firstItem.products?.name || 'Produk'}`
                        : 'Pesanan'}
                    </span>
                    {totalItems > 1 && (
                      <span className="order-product-more">+{totalItems - 1} produk lainnya</span>
                    )}
                  </div>

                  {/* Mini Stepper for shipping orders */}
                  {['paid', 'shipping', 'delivered', 'completed'].includes(order.status) && (
                    <MiniStepper status={order.status} />
                  )}

                  {/* Footer */}
                  <div className="order-card-footer">
                    <div className="order-card-total">
                      <span className="order-total-label">Total Bayar</span>
                      <span className="order-total-amount">{formatRupiah(order.total_amount)}</span>
                    </div>
                    <div className="order-card-action">
                      <span>Lihat Detail</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default MyOrders;
