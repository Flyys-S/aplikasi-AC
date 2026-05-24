import React from 'react';
import './Profile.css';
import headerImg from '../../assets/profile_header.png';
const Profile = () => {
  return (
    <div className="dashboard-container">
      <div className="profile-header">
        <img src={headerImg} alt="Header" className="profile-header-image" />
        <div className="profile-header-overlay">
          <h1 className="profile-company-name">PT. MITRA MAJU SEJATI</h1>
        </div>
      </div>
      <div className="profile-intro" style={{ padding: '24px', color: 'var(--color-on-surface)' }}>
        <p>Selamat datang di sistem retail AC PT. MITRA MAJU SEJATI. Silakan masuk untuk mengakses katalog produk.</p>
      </div>
    </div>
  );
};

export default Profile;


