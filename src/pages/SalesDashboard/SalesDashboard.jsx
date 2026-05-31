import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Activity, ShoppingBag, ChevronRight, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiahCompact, formatTanggalJam } from '../../lib/formatters';
import { getStatusLabel } from '../../lib/statusUtils';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import '../SalesDashboard/SalesDashboard.css';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    unitsSold: 0,
    serviceCount: 0,
    pendingOrders: 0,
    recentActivity: [],
    technicianJobs: [],
    customerOrders: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Admin dashboard data
      if (role === 'admin') {
        const [txnRes, jobRes, pendingRes, activityRes] = await Promise.all([
          supabase.from('transactions').select('total_amount, transaction_items(quantity)').eq('status', 'completed'),
          supabase.from('service_jobs').select('id', { count: 'exact' }),
          supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification'),
          supabase.from('transactions').select('*, customers(name)').order('created_at', { ascending: false }).limit(5)
        ]);

        const totalSales = txnRes.data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const unitsSold = txnRes.data?.reduce((sum, t) => {
          const itemQty = t.transaction_items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
          return sum + itemQty;
        }, 0) || 0;

        setStats({
          totalSales,
          unitsSold,
          serviceCount: jobRes.count || 0,
          pendingOrders: pendingRes.count || 0,
          recentActivity: activityRes.data || [],
          technicianJobs: [],
          customerOrders: []
        });
      } else if (role === 'technician') {
        // Fetch specific active jobs assigned to this technician
        const { data: jobs, error } = await supabase
          .from('service_jobs')
          .select('*, customers(name, phone, address)')
          .order('scheduled_date', { ascending: true })
          .limit(10);
          
        if (error) throw error;
        setStats(prev => ({
          ...prev,
          technicianJobs: jobs || []
        }));
      } else {
        // Customer / default view
        const { data: myTxns } = await supabase
          .from('transactions')
          .select('*, transaction_items(*)')
          .order('created_at', { ascending: false })
          .limit(4);
          
        setStats(prev => ({
          ...prev,
          customerOrders: myTxns || []
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  if (loading) {
    return <PageLoader text="Memuat dashboard..." />;
  }

  const userDisplayName = user?.email?.split('@')[0]?.toUpperCase() || 'PENGGUNA';
  const roleTitle = role === 'admin' ? '🛡️ Administrator' : role === 'technician' ? '🔧 Teknisi Lapangan' : '👤 Customer Premium';

  return (
    <div className="dashboard-container">
      <TopHeader title="Sistem MMS" subtitle={`Sesi Aktif: ${roleTitle}`} />

      <div className="page-content fade-in" style={{ paddingBottom: '100px', paddingLeft: '24px', paddingRight: '24px' }}>
        
        {/* Dynamic Premium Welcoming Glassmorphic Header Card */}
        <div className="welcoming-card glass-panel fade-in">
          <div className="welcome-inner">
            <span className="welcome-greet">Selamat Datang Kembali,</span>
            <h2 className="welcome-name">{userDisplayName}</h2>
            <p className="welcome-desc">Solusi pendingin udara & instalasi tepercaya untuk kenyamanan terbaik Anda.</p>
          </div>
          <div className="welcome-decor-orb">❄️</div>
        </div>

        {/* 1. ADMIN DASHBOARD VIEW */}
        {role === 'admin' && (
          <>
            {/* Urgent Alerts */}
            {stats.pendingOrders > 0 && (
              <div 
                className="urgent-alert-card card-elevation fade-in" 
                onClick={() => navigate('/online-orders')}
              >
                <div className="alert-icon-wrapper">
                  <ShoppingBag size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="alert-title">
                    {stats.pendingOrders} Pesanan Menunggu Verifikasi
                  </p>
                  <p className="alert-subtitle">Segera periksa bukti transfer transaksi baru pelanggan.</p>
                </div>
                <ChevronRight size={20} className="alert-chevron" />
              </div>
            )}

            {/* Primary Stats HSL Gradient Grid */}
            <section className="dashboard-stats-grid">
              <div className="stat-card-gradient sales-grad">
                <div className="stat-card-header">
                  <DollarSign size={24} className="stat-icon-light" />
                  <TrendingUp size={20} />
                </div>
                <span className="stat-card-label">Total Pendapatan</span>
                <span className="stat-card-value">
                  {formatRupiahCompact(stats.totalSales)}
                </span>
              </div>

              <div className="stat-card-gradient units-grad">
                <div className="stat-card-header">
                  <Package size={24} className="stat-icon-light" />
                </div>
                <span className="stat-card-label">Unit Terjual</span>
                <span className="stat-card-value">
                  {stats.unitsSold} Unit
                </span>
              </div>

              <div className="stat-card-gradient service-grad">
                <div className="stat-card-header">
                  <Activity size={24} className="stat-icon-light" />
                </div>
                <span className="stat-card-label">Total Layanan Servis</span>
                <span className="stat-card-value">{stats.serviceCount} Servis</span>
              </div>
            </section>

            {/* Recent Transactions list */}
            <section className="recent-activity" style={{ marginTop: '32px' }}>
              <div className="section-header">
                <h3 className="section-title">Transaksi Terkini</h3>
                <span className="link-text" onClick={() => navigate('/transactions')}>Lihat Semua</span>
              </div>
              <div className="activity-list card-elevation">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((txn) => (
                    <div 
                      key={txn.id} 
                      className="activity-item-mms" 
                      onClick={() => navigate(`/transactions/${txn.id}`)}
                    >
                      <div className="activity-icon-container">
                        <ShoppingBag size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="activity-cust-name">{txn.customers?.name || 'Pelanggan Umum'}</span>
                        <span className="activity-meta">{formatTanggalJam(txn.created_at)} · {txn.payment_method}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="activity-amount">
                          {formatRupiahCompact(txn.total_amount)}
                        </span>
                        <span className={`activity-status-badge ${txn.status}`}>
                          {getStatusLabel(txn.status).label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={Activity} text="Belum ada aktivitas transaksi hari ini." />
                )}
              </div>
            </section>
          </>
        )}

        {/* 2. TECHNICIAN DASHBOARD VIEW */}
        {role === 'technician' && (
          <section className="technician-section fade-in">
            <div className="section-header" style={{ marginTop: '24px' }}>
              <h3 className="section-title">Jadwal Tugas Maintenance Hari Ini</h3>
              <span className="link-text" onClick={() => navigate('/service')}>Lihat Semua Tugas</span>
            </div>
            
            <div className="technician-jobs-grid">
              {stats.technicianJobs.length > 0 ? (
                stats.technicianJobs.map((job) => (
                  <div key={job.id} className="job-card-mms glass-panel" onClick={() => navigate('/service')}>
                    <div className="job-card-header">
                      <span className="job-date">📅 {new Date(job.scheduled_date).toLocaleDateString('id-ID')}</span>
                      <span className={`job-status-chip ${job.status}`}>{job.status?.replace('_', ' ')?.toUpperCase()}</span>
                    </div>
                    <h4 className="job-customer-name">{job.customers?.name || 'Pelanggan'}</h4>
                    <p className="job-address">📍 {job.customers?.address || 'Alamat tidak tertera'}</p>
                    <div className="job-description-block">
                      <strong>Keluhan / Tugas:</strong>
                      <p>{job.description || 'Pembersihan AC rutin berkala.'}</p>
                    </div>
                    <button className="job-action-btn-mms">
                      Update Pekerjaan
                    </button>
                  </div>
                ))
              ) : (
                <EmptyState icon={Activity} text="Tidak ada penugasan pemeliharaan untuk Anda hari ini." />
              )}
            </div>
          </section>
        )}

        {/* 3. CUSTOMER / DEFAULT DASHBOARD VIEW */}
        {role !== 'admin' && role !== 'technician' && (
          <section className="customer-section fade-in">
            {/* Promo Carousel Banner */}
            <div className="customer-promo-banner glass-panel">
              <div className="promo-details">
                <span className="promo-badge-tag">PROMO BULAN INI</span>
                <h3>Dapatkan Diskon Servis Berkala 15%</h3>
                <p>Jaga kesegaran AC rumah Anda dengan pembersihan rutin bersama teknisi handal kami.</p>
                <button className="promo-btn" onClick={() => navigate('/service')}>Ajukan Servis Sekarang</button>
              </div>
              <div className="promo-icon-bg">❄️</div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="quick-actions-grid" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="quick-action-button glass-panel" onClick={() => navigate('/catalog')}>
                <span className="qa-icon">🛍️</span>
                <h4>Katalog AC</h4>
                <p>Lihat & beli unit AC baru</p>
              </div>
              <div className="quick-action-button glass-panel" onClick={() => navigate('/service')}>
                <span className="qa-icon">🔧</span>
                <h4>Ajukan Servis</h4>
                <p>Jadwalkan teknisi AC</p>
              </div>
            </div>

            {/* Order status tracking cards */}
            <div className="section-header" style={{ marginTop: '36px' }}>
              <h3 className="section-title">Riwayat Pesanan Saya</h3>
              <span className="link-text" onClick={() => navigate('/transactions')}>Selengkapnya</span>
            </div>

            <div className="customer-orders-list">
              {stats.customerOrders.length > 0 ? (
                stats.customerOrders.map(order => (
                  <div key={order.id} className="customer-order-card glass-panel" onClick={() => navigate(`/transactions/${order.id}`)}>
                    <div className="order-header-row">
                      <span className="order-id">ID: #{order.id.slice(0, 8)}</span>
                      <span className={`order-status-badge ${order.status}`}>{getStatusLabel(order.status).label}</span>
                    </div>
                    <div className="order-details-row">
                      <span className="order-price">{formatRupiahCompact(order.total_amount)}</span>
                      <span className="order-date">{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Package} text="Anda belum memiliki pemesanan terdaftar saat ini." />
              )}
            </div>
          </section>
        )}

      </div>

      <Navigation />
    </div>
  );
};

export default SalesDashboard;
