import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, Clock, Truck, CheckCircle2,
  MapPin, Phone, User, XCircle, PackageX, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatAngka, formatTanggalJam } from '../../lib/formatters';
import { getStatusLabel, getOrderProgress } from '../../lib/statusUtils';
import InlineLoader from '../../components/InlineLoader';
import { useAuth } from '../../context/AuthContext';
import './OrderTracking.css';

const TRACKING_STEPS = [
  {
    label: 'Pesanan Dibuat',
    desc: 'Pesanan Anda telah diterima, menunggu verifikasi pembayaran.',
    icon: ShoppingBag,
  },
  {
    label: 'Menunggu Kurir',
    desc: 'Pembayaran telah dikonfirmasi. Admin sedang menyiapkan pesanan.',
    icon: Clock,
  },
  {
    label: 'Pesanan Dikirim',
    desc: 'Pesanan sedang dalam perjalanan menuju alamat Anda.',
    icon: Truck,
  },
  {
    label: 'Pesanan Sampai',
    desc: 'Pesanan telah tiba di alamat tujuan. Terima kasih!',
    icon: CheckCircle2,
  },
];

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const isVisitorOrGuest = !user || role === 'visitor';
  const hasNormalSidebar = role === 'admin' || role === 'technician';
  const containerClass = hasNormalSidebar ? '' : (isVisitorOrGuest ? ' customer-layout' : ' guest-layout');

  const fetchOrder = useCallback(async () => {
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
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className={`dashboard-container${containerClass}`}>
        <InlineLoader text="Memuat detail pesanan..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`dashboard-container${containerClass}`}>
        <div className="tracking-not-found">
          <PackageX size={56} color="#d1d5db" />
          <p>Pesanan tidak ditemukan.</p>
          <button onClick={() => navigate('/my-orders')} className="tracking-back-link">
            Kembali ke Pesanan Saya
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getOrderProgress(order.status);
  const statusInfo = getStatusLabel(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className={`dashboard-container${containerClass}`}>
      {/* Nav */}
      <div className="tracking-nav">
        <button className="tracking-nav-back" onClick={() => navigate('/my-orders')}>
          <ArrowLeft size={20} />
        </button>
        <div className="tracking-nav-title">
          <h2>Lacak Pesanan</h2>
          <span>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        {order.payment_proof_url && (
          <button
            className="tracking-proof-btn"
            onClick={() => window.open(order.payment_proof_url, '_blank')}
            title="Lihat bukti bayar"
          >
            <ImageIcon size={18} />
          </button>
        )}
      </div>

      <div className="tracking-content fade-in">

        {/* Status Banner */}
        <div
          className={`tracking-status-banner ${isCancelled ? 'cancelled' : ''}`}
          style={!isCancelled ? { borderColor: statusInfo.color, background: statusInfo.bg } : {}}
        >
          {isCancelled ? (
            <>
              <XCircle size={28} color="#ff4444" />
              <div>
                <p className="tsb-title" style={{ color: '#ff4444' }}>Pesanan Dibatalkan</p>
                <p className="tsb-desc">Pesanan ini telah dibatalkan oleh admin.</p>
              </div>
            </>
          ) : (
            <>
              <div className="tsb-icon" style={{ color: statusInfo.color }}>
                {currentStep === 3
                  ? <CheckCircle2 size={28} />
                  : currentStep === 2
                  ? <Truck size={28} />
                  : currentStep === 1
                  ? <Clock size={28} />
                  : <ShoppingBag size={28} />}
              </div>
              <div>
                <p className="tsb-title" style={{ color: statusInfo.color }}>
                  {statusInfo.label}
                </p>
                <p className="tsb-desc">{TRACKING_STEPS[currentStep]?.desc}</p>
              </div>
            </>
          )}
        </div>

        {/* Tracking Stepper */}
        {!isCancelled && (
          <div className="tracking-card">
            <h3 className="tracking-card-title">Status Pengiriman</h3>
            <div className="tracking-stepper">
              {TRACKING_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isDone = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={index} className={`ts-row ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                    {/* Line connector (top) */}
                    {index > 0 && (
                      <div className={`ts-connector ${index <= currentStep ? 'active' : ''}`} />
                    )}

                    <div className="ts-row-inner">
                      {/* Icon circle */}
                      <div className={`ts-icon-wrap ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}>
                        <StepIcon size={16} />
                      </div>

                      {/* Content */}
                      <div className="ts-content">
                        <span className="ts-label">{step.label}</span>
                        {isCurrent && (
                          <span className="ts-current-tag">Saat ini</span>
                        )}
                        {isDone && (
                          <CheckCircle2 size={14} color="#008756" className="ts-done-icon" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Buyer Info */}
        <div className="tracking-card">
          <h3 className="tracking-card-title">Informasi Pengiriman</h3>
          <div className="tracking-info-rows">
            <div className="tracking-info-row">
              <User size={14} color="#9ca3af" />
              <span>{order.buyer_name || 'Tidak tersedia'}</span>
            </div>
            <div className="tracking-info-row">
              <Phone size={14} color="#9ca3af" />
              <span>{order.buyer_phone || 'Tidak tersedia'}</span>
            </div>
            <div className="tracking-info-row">
              <MapPin size={14} color="#9ca3af" />
              <span>{order.buyer_address || 'Tidak tersedia'}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="tracking-card">
          <h3 className="tracking-card-title">Daftar Produk</h3>
          <div className="tracking-items">
            {order.items?.map((item, idx) => (
              <div key={idx} className="tracking-item-row">
                <div className="tracking-item-info">
                  <span className="tracking-item-name">
                    {item.products?.brand} {item.products?.name}
                  </span>
                  <span className="tracking-item-qty">x{item.quantity}</span>
                </div>
                <span className="tracking-item-price">{formatAngka(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="tracking-total-row">
            <span>Total Bayar</span>
            <span className="tracking-total-amount">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>

        {/* Order Date */}
        <p className="tracking-order-date">
          <Clock size={12} />
          Dipesan pada {formatTanggalJam(order.created_at)}
        </p>

        {/* Actions */}
        <div className="tracking-actions">
          <button className="tracking-btn-secondary" onClick={() => navigate('/my-orders')}>
            Kembali
          </button>
          <button className="tracking-btn-primary" onClick={() => navigate('/catalog')}>
            Belanja Lagi
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
