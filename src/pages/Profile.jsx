import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, LogOut, ChevronRight, Settings, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import './SalesDashboard.css'; // Reuse container styles

const Profile = () => {
  const navigate = useNavigate();
  const { user, role, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
      navigate('/');
    }
  };

  const menuItems = [
    { 
      title: 'Informasi Akun', 
      icon: <User size={20} />, 
      subtitle: user?.email,
      action: () => {} 
    },
    { 
      title: 'Manajemen Pengguna', 
      icon: <Shield size={20} />, 
      subtitle: 'Kelola akses teknisi & admin',
      show: isAdmin,
      action: () => navigate('/users')
    },
    { 
      title: 'Pengaturan Aplikasi', 
      icon: <Settings size={20} />, 
      subtitle: 'Notifikasi & preferensi',
      action: () => {} 
    },
    { 
      title: 'Tentang Aplikasi', 
      icon: <Info size={20} />, 
      subtitle: 'Versi 1.2.0 (Premium)',
      action: () => {} 
    }
  ];

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Pengaturan Profil" subtitle="Manajemen Akun & Aplikasi" />

      <div className="page-content" style={{ paddingBottom: '100px' }}>
        {/* Profile Info */}
        <div className="card-elevation" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '30px', 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '40px', 
            fontWeight: 'bold',
            marginBottom: '16px',
            boxShadow: '0 10px 20px rgba(0, 85, 255, 0.2)'
          }}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px' }}>{user?.user_metadata?.full_name || 'Admin Arctic'}</h2>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: 'var(--color-primary)', 
            backgroundColor: 'rgba(0, 85, 255, 0.1)', 
            padding: '4px 12px', 
            borderRadius: '20px',
            textTransform: 'uppercase'
          }}>
            {role || 'Staff'}
          </span>
        </div>

        {/* Menu List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {menuItems.map((item, idx) => {
            if (item.show === false) return null;
            return (
              <div 
                key={idx} 
                className="card-elevation" 
                onClick={item.action}
                style={{ 
                  padding: '16px', 
                  borderRadius: '16px', 
                  backgroundColor: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(107, 114, 128, 0.05)', color: '#666' }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{item.title}</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>{item.subtitle}</span>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </div>
            );
          })}

          <div 
            className="card-elevation" 
            onClick={handleLogout}
            style={{ 
              marginTop: '16px',
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'rgba(255, 68, 68, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 68, 68, 0.1)'
            }}
          >
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444' }}>
              <LogOut size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#ff4444' }}>Keluar Akun</span>
              <span style={{ fontSize: '12px', color: '#ff8888' }}>Akhiri sesi login Anda</span>
            </div>
            <ChevronRight size={18} color="#ffcccc" />
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
