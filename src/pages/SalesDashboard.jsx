import React from 'react';
import { TrendingUp, Users, Package, Activity, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const { role, user } = useAuth();
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  const userName = user?.user_metadata?.full_name || 'Pengguna';

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Dashboard" subtitle={`Selamat Pagi, ${userName} (${displayRole})`} />

      <div className="page-content">
        <section className="stats-grid">
          <div className="stat-card card-elevation">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 85, 255, 0.1)', color: 'var(--color-primary)' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Penjualan</span>
              <span className="stat-value">Rp 45.2M</span>
              <span className="stat-trend positive">+12% vs bulan lalu</span>
            </div>
          </div>
          
          <div className="stat-card card-elevation">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(112, 224, 255, 0.2)', color: 'var(--color-secondary-dark)' }}>
              <Package size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Unit Terjual</span>
              <span className="stat-value">128</span>
              <span className="stat-trend positive">+5 unit</span>
            </div>
          </div>

          <div className="stat-card card-elevation">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)', color: '#b57a00' }}>
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Layanan Servis</span>
              <span className="stat-value">34</span>
              <span className="stat-trend pending">4 perlu jadwal</span>
            </div>
          </div>
        </section>

        <section className="recent-activity">
          <div className="section-header">
            <h3>Aktivitas Terkini</h3>
            <span className="link-text">Lihat Semua</span>
          </div>
          <div className="activity-list card-elevation">
            {[1, 2, 3].map((item) => (
              <div key={item} className="activity-item">
                <div className="activity-avatar">
                  <Users size={16} />
                </div>
                <div className="activity-details">
                  <span className="activity-title">Pembelian Unit AC Daikin 1/2 PK</span>
                  <span className="activity-time">Oleh Bpk. Budi - 2 jam yang lalu</span>
                </div>
                <div className="activity-status success">Selesai</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SalesDashboard;
