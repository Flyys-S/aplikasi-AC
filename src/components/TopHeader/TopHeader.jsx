import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ArrowLeft, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './TopHeader.css';

const TopHeader = ({ title, subtitle, onBack, children, isAdminDashboard, searchValue, onSearchChange }) => {
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mockNotifications = [];
    if (role === 'admin') {
      mockNotifications = [
        { id: 1, text: 'Pesanan Online baru masuk #TX-9021', time: '5m lalu', read: false },
        { id: 2, text: 'Teknisi Budi mengirim laporan cuci AC', time: '1j lalu', read: false },
        { id: 3, text: 'Stok AC Panasonic 1/2 PK menipis', time: '3j lalu', read: false }
      ];
    } else if (role === 'technician') {
      mockNotifications = [
        { id: 1, text: 'Tugas Baru: Cuci AC di Jl. Mangga No. 12', time: '10m lalu', read: false },
        { id: 2, text: 'Jadwal servis rutin AC Daikin H-1', time: '2j lalu', read: false },
        { id: 3, text: 'Pembaruan panduan instalasi unit AC', time: '1h lalu', read: false }
      ];
    } else {
      mockNotifications = [
        { id: 1, text: 'Invoice pembayaran #TX-8802 diterbitkan', time: '15m lalu', read: false },
        { id: 2, text: 'Jadwal pemasangan AC disetujui besok', time: '4j lalu', read: false },
        { id: 3, text: 'Selamat bergabung di Mitra Maju Sejati!', time: '1h lalu', read: false }
      ];
    }
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, [role]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      const cleanUrl = window.location.origin + import.meta.env.BASE_URL;
      window.history.replaceState(null, '', cleanUrl);
      navigate('/', { replace: true });
      setTimeout(() => {
        signOut();
      }, 100);
    }
  };

  // Get user initial for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';

  return (
    <header className={`top-header glass-panel ${isAdminDashboard ? 'admin-top-header' : ''}`}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isMobile ? (
          <button 
            className="icon-btn hamburger-btn-customer" 
            onClick={() => document.body.classList.toggle('sidebar-open')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              color: 'var(--color-on-surface)',
              marginRight: '6px'
            }}
            title="Menu"
          >
            <Menu size={20} />
          </button>
        ) : (
          role === 'visitor' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
              <button 
                className="icon-btn back-btn-customer" 
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                className="icon-btn hamburger-btn-customer" 
                onClick={() => document.body.classList.toggle('sidebar-open')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          ) : (
            onBack && (
              <button className="back-btn-header" onClick={onBack}>
                <ArrowLeft size={22} />
              </button>
            )
          )
        )}
        <div className="header-info">
          <h2>{title}</h2>
          {subtitle && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isAdminDashboard && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              )}
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="header-actions">
        {isAdminDashboard && (
          <div className="header-search-bar">
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchValue || ''} 
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="header-search-input"
            />
          </div>
        )}
        {children}
        <button 
          className="icon-btn theme-toggle-btn" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          style={{ marginRight: '8px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="icon-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifikasi"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge red-dot-badge"></span>}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown glass-panel" style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '280px',
              borderRadius: '16px',
              padding: '16px',
              zIndex: 1000,
              boxShadow: 'var(--shadow-hover)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '11px', color: 'var(--color-on-surface)' }}>NOTIFIKASI</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', textAlign: 'left' }}>
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', opacity: n.read ? 0.65 : 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: n.read ? '500' : '700', color: 'var(--color-on-surface)' }}>{n.text}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>{n.time}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '12px 0' }}>Tidak ada notifikasi baru</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-profile">
          <div 
            className="user-avatar" 
            onClick={() => navigate('/profile')} 
            style={{ cursor: 'pointer' }}
          >
            {userInitial}
          </div>
          {!isMobile && (
            <button className="logout-btn" onClick={handleLogout} title="Keluar">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

