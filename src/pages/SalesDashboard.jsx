import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Package, Activity, ShoppingBag, ChevronRight, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatRupiahCompact, formatTanggalJam } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    unitsSold: 0,
    serviceCount: 0,
    pendingOrders: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
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
              backgroundColor: '#fffbeb', 
              border: '1px solid #fef3c7', 
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
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#92400e' }}>
                {stats.pendingOrders} Pesanan Menunggu Verifikasi
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#b45309' }}>Segera cek bukti transfer pelanggan</p>
            </div>
            <ChevronRight size={20} color="#b45309" />
          </div>
        )}

        {/* Primary Stats Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <DollarSign size={24} style={{ opacity: 0.8 }} />
              <TrendingUp size={20} />
            </div>
            <span style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>Total Pendapatan</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }}>
              {formatRupiahCompact(stats.totalSales)}
            </span>
          </div>

          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <Package size={24} color="var(--color-primary)" />
            </div>
            <span style={{ fontSize: '12px', color: '#999', display: 'block' }}>Unit Terjual</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', color: '#333' }}>
              {stats.unitsSold} Unit
            </span>
          </div>

          <div className="card-elevation" style={{ padding: '20px', borderRadius: '20px', backgroundColor: 'white', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(0,135,86,0.1)', color: '#008756' }}>
                <Activity size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#999', display: 'block' }}>Total Pekerjaan Servis</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{stats.serviceCount} Servis</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="recent-activity">
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Transaksi Terkini</h3>
            <span className="link-text" onClick={() => navigate('/transactions')}>Lihat Semua</span>
          </div>
          <div className="activity-list card-elevation" style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden' }}>
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((txn) => (
                <div 
                  key={txn.id} 
                  className="activity-item" 
                  onClick={() => navigate(`/transactions/${txn.id}`)}
                  style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  <div style={{ backgroundColor: txn.is_online ? 'rgba(0, 85, 255, 0.1)' : 'rgba(107, 114, 128, 0.1)', padding: '10px', borderRadius: '12px' }}>
                    <ShoppingBag size={18} color={txn.is_online ? 'var(--color-primary)' : '#666'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{txn.customers?.name || 'Pelanggan Umum'}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>{formatTanggalJam(txn.created_at)} · {txn.payment_method}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      {formatRupiahCompact(txn.total_amount)}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      color: txn.status === 'completed' ? '#008756' : '#f5a623'
                    }}>
                      {txn.status === 'completed' ? 'SUKSES' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                Belum ada aktivitas hari ini.
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SalesDashboard;
