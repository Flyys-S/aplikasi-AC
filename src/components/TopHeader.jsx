import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TopHeader.css';

const TopHeader = ({ title, subtitle, onBack, children }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
    }
  };

  // Get user initial for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';

  return (
    <header className="top-header glass-panel">
      <div className="header-left">
        {onBack && (
          <button className="back-btn-header" onClick={onBack}>
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="header-info">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      
      <div className="header-actions">
        {children}
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
