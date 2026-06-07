import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ArrowLeft, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './TopHeader.css';

const TopHeader = ({ title, subtitle, onBack, children }) => {
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    <header className="top-header glass-panel">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {role === 'visitor' ? (
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
        )}
        <div className="header-info">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      
      <div className="header-actions">
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
          <span className="badge"></span>
        </div>
        
        <div className="user-profile">
          <div 
            className="user-avatar" 
            onClick={() => navigate('/profile')} 
            style={{ cursor: 'pointer' }}
          >
            {userInitial}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

