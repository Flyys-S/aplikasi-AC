import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Activity, ShoppingBag, ChevronRight, Loader2, DollarSign } from 'lucide-react';
import { formatRupiahCompact, formatTanggalJam } from '../../lib/formatters';
import { getStatusLabel } from '../../lib/statusUtils';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import '../SalesDashboard/SalesDashboard.css';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { getTransactions, getServices, getProducts } = useData();
  const [stats, setStats] = useState({
    totalSales: 0,
    unitsSold: 0,
    serviceCount: 0,
    pendingOrders: 0,
    recentActivity: [],
    technicianJobs: [],
    customerOrders: [],
    lowStockCount: 0,
    todayServices: []
  });
  const [loading, setLoading] = useState(true);
  const [adminSearch, setAdminSearch] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Admin dashboard data
      if (role === 'admin') {
        const [txns, jobs, productsList] = await Promise.all([
          getTransactions(),
          getServices(),
          getProducts ? getProducts() : []
        ]);

        const completedTxns = txns.filter(t => t.status === 'completed');
        const totalSales = completedTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const unitsSold = completedTxns.reduce((sum, t) => {
          const itemQty = t.transaction_items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
          return sum + itemQty;
        }, 0) || 0;

        const pendingOrders = txns.filter(t => t.status === 'pending_verification').length;
        const recentActivity = [...txns].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        const lowStockCount = productsList ? productsList.filter(p => p.stock > 0 && p.stock <= 5).length : 0;

        const todayStr = new Date().toISOString().split('T')[0];
        const todayServices = jobs.filter(j => {
          return j.status === 'pending' || j.status === 'in_progress' || j.scheduled_date?.startsWith(todayStr);
        });

        setStats({
          totalSales,
          unitsSold,
          serviceCount: jobs.length || 0,
          pendingOrders,
          recentActivity,
          lowStockCount,
          todayServices,
          technicianJobs: [],
          customerOrders: []
        });
      } else if (role === 'technician') {
        const jobs = await getServices();
        setStats(prev => ({
          ...prev,
          technicianJobs: jobs.slice(0, 10)
        }));
      } else {
        const txns = await getTransactions();
        setStats(prev => ({
          ...prev,
          customerOrders: txns.slice(0, 4)
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.message);
    } finally {
      setLoading(false);
    }
  }, [role, getTransactions, getServices, getProducts]);

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

  const filteredRecentActivity = stats.recentActivity.filter(txn => {
    if (!adminSearch) return true;
    const searchLower = adminSearch.toLowerCase();
    return (
      txn.customers?.name?.toLowerCase().includes(searchLower) ||
      txn.id.toLowerCase().includes(searchLower) ||
      txn.payment_method?.toLowerCase().includes(searchLower)
    );
  });

  const filteredServices = (stats.todayServices || []).filter(job => {
    if (!adminSearch) return true;
    const searchLower = adminSearch.toLowerCase();
    return (
      job.customers?.name?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.status?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="dashboard-container">
      <TopHeader 
        title={role === 'admin' ? "Dashboard" : "Sistem MMS"} 
        subtitle={role === 'admin' ? "Sesi Aktif: Administrator" : `Sesi Aktif: ${roleTitle}`}
        isAdminDashboard={role === 'admin'}
        searchValue={adminSearch}
        onSearchChange={setAdminSearch}
      />

      <div className="page-content fade-in" style={{ paddingBottom: '100px', paddingLeft: '24px', paddingRight: '24px' }}>
        
        {/* Dynamic Premium Welcoming Glassmorphic Header Card for Non-Admin */}
        {role !== 'admin' && (
          <div className="welcoming-card glass-panel fade-in">
            <div className="welcome-inner">
              <span className="welcome-greet">Selamat Datang Kembali,</span>
              <h2 className="welcome-name">{userDisplayName}</h2>
              <p className="welcome-desc">Solusi pendingin udara & instalasi tepercaya untuk kenyamanan terbaik Anda.</p>
            </div>
            <div className="welcome-decor-orb">❄️</div>
          </div>
        )}

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

            {/* Row 1 (Welcome & Quick Action - Grid 65:35) */}
            <div className="admin-row-1-grid">
              <div className="admin-welcome-banner">
                <div className="welcome-inner">
                  <span className="welcome-greet">Selamat datang kembali,</span>
                  <h2 className="welcome-name">{userDisplayName === 'ADMIN' ? 'Rafly Rajwa' : userDisplayName}</h2>
                  <p className="welcome-desc">Operasional hari ini berjalan lancar. Semua sistem terpantau normal.</p>
                </div>
                <div className="welcome-decor-orb">❄️</div>
              </div>
              
              <div className="admin-quick-actions-card glass-panel">
                <button className="quick-action-btn primary" onClick={() => navigate('/transactions/new')}>
                  <span className="btn-icon">+</span> Tambah Transaksi Baru
                </button>
                <button className="quick-action-btn secondary" onClick={() => navigate('/service')}>
                  <span className="btn-icon">+</span> Jadwalkan Servis Baru
                </button>
              </div>
            </div>

            {/* Row 2 (KPI Metrics - Grid 4 Columns) */}
            <section className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="kpi-icon-wrapper blue-soft">
                  <DollarSign size={20} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">Total Pendapatan</span>
                  <span className="kpi-value">{formatRupiahCompact(stats.totalSales)}</span>
                  <svg className="kpi-sparkline" viewBox="0 0 100 20" width="100%" height="20">
                    <path d="M0 15 Q 15 5, 30 12 T 60 4 T 90 15 T 100 10" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrapper green-soft">
                  <Package size={20} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">Unit Terjual</span>
                  <span className="kpi-value">{stats.unitsSold} Unit</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrapper orange-soft">
                  <Activity size={20} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">Layanan Servis</span>
                  <span className="kpi-value">{stats.serviceCount} Servis</span>
                </div>
              </div>

              <div className="admin-kpi-card">
                <div className="kpi-icon-wrapper pink-soft">
                  <TrendingUp size={20} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">Stok Menipis</span>
                  <span className="kpi-value pink-value">{stats.lowStockCount} Item</span>
                </div>
              </div>
            </section>

            {/* Row 3 (Data Monitoring - Grid 60:40) */}
            <div className="admin-monitoring-grid">
              {/* Left card: Transaksi Terkini */}
              <div className="monitoring-card left-card glass-panel">
                <div className="monitoring-header">
                  <h3>Transaksi Terkini</h3>
                  <button className="link-arrow-btn" onClick={() => navigate('/transactions')}>
                    Lihat Semua ↗
                  </button>
                </div>
                <div className="monitoring-body">
                  {filteredRecentActivity.length > 0 ? (
                    <div className="compact-activity-list">
                      {filteredRecentActivity.map((txn) => (
                        <div 
                          key={txn.id} 
                          className="compact-activity-item" 
                          onClick={() => navigate(`/transactions/${txn.id}`)}
                        >
                          <div className="compact-item-details">
                            <span className="compact-cust-name">{txn.customers?.name || 'Pelanggan Umum'}</span>
                            <span className="compact-meta">{formatTanggalJam(txn.created_at)}</span>
                          </div>
                          <div className="compact-item-values">
                            <span className="compact-amount">{formatRupiahCompact(txn.total_amount)}</span>
                            <span className={`activity-status-badge ${txn.status}`}>
                              {getStatusLabel(txn.status).label.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="compact-empty-state">
                      <ShoppingBag size={32} style={{ color: 'var(--color-outline)' }} />
                      <p>Belum ada transaksi hari ini.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right card: Antrean Servis Hari Ini */}
              <div className="monitoring-card right-card glass-panel">
                <div className="monitoring-header">
                  <h3>Antrean Servis Hari Ini</h3>
                </div>
                <div className="monitoring-body">
                  {filteredServices.length > 0 ? (
                    <div className="service-queue-list">
                      {filteredServices.slice(0, 3).map((job) => (
                        <div 
                          key={job.id} 
                          className="service-queue-item"
                          onClick={() => navigate('/service')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="queue-info">
                            <span className="queue-name">{job.customers?.name || 'Pelanggan'}</span>
                            <span className="queue-desc">{job.description || 'Pembersihan/Servis AC'}</span>
                          </div>
                          <span className={`queue-badge ${job.status}`}>
                            {job.status === 'in_progress' ? 'ON PROCESS' : (job.status || 'PENDING').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="compact-empty-state">
                      <Activity size={32} style={{ color: 'var(--color-outline)' }} />
                      <p>Tidak ada antrean servis hari ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
