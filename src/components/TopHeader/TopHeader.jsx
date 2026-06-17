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
        
        <div className="icon-btn notification-btn">
          <Bell size={20} />
          <span className="badge red-dot-badge"></span>
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

