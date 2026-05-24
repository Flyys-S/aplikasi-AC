import React, { useState, useEffect } from 'react';
import './Profile.css';
import avatarImg from '../../assets/user_avatar.png'; // placeholder avatar

const UserProfile = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }, [isDark]);
  const toggleDarkMode = () => setIsDark(prev => !prev);
  return (
    <div className="dashboard-container user-profile">
      <button className="dark-mode-toggle btn" onClick={toggleDarkMode} aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>{isDark ? '🌙' : '☀️'}</button>
      <div className="user-header glass">
        <div className="avatar" style={{ backgroundImage: `url(${avatarImg})` }}></div>
        <h2 className="user-name">Nama Pengguna</h2>
        <p className="user-email">user@example.com</p>
      </div>
      <div className="user-details glass">
        {/* Add more user details or settings here */}
        <p>Ini adalah halaman profil pengguna. Anda dapat menambahkan formulir pengaturan di sini.</p>
      </div>
    </div>
  );
};

export default UserProfile;
