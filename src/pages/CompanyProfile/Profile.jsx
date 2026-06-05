import React from 'react';
import '../Login/Login.css';
import './Profile.css';
import headerImg from '../../assets/profile_header.png';

const CompanyProfile = () => {
  return (
    <div className="dashboard-container">
      <div className="profile-header">
        <div className="ambient-orb orb-primary"></div>
        <div className="ambient-orb orb-accent"></div>
        <div className="profile-header-image" style={{ backgroundImage: `url(${headerImg})` }}></div>
        <div className="profile-header-overlay">
          <h1 className="profile-company-name">MITRA MAJU SEJATI</h1>
        </div>
      </div>
      <div className="profile-intro" style={{ padding: '24px', color: 'var(--color-on-surface)' }}>
        <p>Selamat datang di sistem retail AC MITRA MAJU SEJATI. Silakan masuk untuk mengakses katalog produk.</p>
      </div>
    </div>
  );
};

export default CompanyProfile;


