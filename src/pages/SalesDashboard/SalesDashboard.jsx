import React, { useState, useEffect } from 'react';
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
  useAuth(); // subscribe to auth context changes
  const [stats, setStats] = useState({
    totalSales: 0,
    unitsSold: 0,
    serviceCount: 0,
    pendingOrders: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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
        recentActivity: activityRes.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <PageLoader text="Memuat dashboard..." />;
  }

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Dashboard Bisnis" subtitle="Ringkasan Performa Arctic Clarity" />

      <div className="page-content" style={{ paddingBottom: '100px' }}>
        {/* Urgent Alerts */}
        {stats.pendingOrders > 0 && (
          <div 
            className="card-elevation fade-in" 
            onClick={() => navigate('/online-orders')}
            style={{ 
              padding: '16px', 
              backgroundColor: 'rgba(245, 166, 35, 0.08)', 
              border: '1px solid rgba(245, 166, 35, 0.25)', 
              borderRadius: '16px', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ backgroundColor: '#f5a623', color: 'white', padding: '8px', borderRadius: '12px' }}>
              <ShoppingBag size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#e67e22' }}>
                {stats.pendingOrders} Pesanan Menunggu Verifikasi
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#f39c12' }}>Segera cek bukti transfer pelanggan</p>
            </div>
            <ChevronRight size={20} color="#f39c12" />
          </div>
        )}

        {/* Primary Stats Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <DollarSign size={24} style={{ opacity: 0.8 }} />
              <TrendingUp size={20} />
            </div>
            <span style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>Total Pendapatan</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }}>
              {formatRupiahCompact(stats.totalSales)}
            </span>
          </div>

          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <Package size={24} color="var(--color-primary)" />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', display: 'block' }}>Unit Terjual</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', color: 'var(--color-on-surface)' }}>
              {stats.unitsSold} Unit
            </span>
          </div>

          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--color-surface-container-lowest)', gridColumn: 'span 2', border: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(0,135,86,0.1)', color: '#008756' }}>
                <Activity size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', display: 'block' }}>Total Pekerjaan Servis</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-on-surface)' }}>{stats.serviceCount} Servis</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="recent-activity">
          <div className="section-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-on-surface)' }}>Transaksi Terkini</h3>
            <span className="link-text" onClick={() => navigate('/transactions')} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Lihat Semua</span>
          </div>
          <div className="activity-list card-elevation" style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }}>
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((txn) => (
                <div 
                  key={txn.id} 
                  className="activity-item" 
                  onClick={() => navigate(`/transactions/${txn.id}`)}
                  style={{ padding: '16px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{ backgroundColor: txn.is_online ? 'rgba(0, 85, 255, 0.08)' : 'rgba(107, 114, 128, 0.08)', padding: '10px', borderRadius: '12px' }}>
                    <ShoppingBag size={18} color={txn.is_online ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-on-surface)' }}>{txn.customers?.name || 'Pelanggan Umum'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>{formatTanggalJam(txn.created_at)} · {txn.payment_method}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      {formatRupiahCompact(txn.total_amount)}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      color: getStatusLabel(txn.status).color
                    }}>
                      {getStatusLabel(txn.status).label.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={Activity} text="Belum ada aktivitas hari ini." />
            )}
          </div>
        </section>
      </div>

      <Navigation />
    </div>
  );
};

export default SalesDashboard;


