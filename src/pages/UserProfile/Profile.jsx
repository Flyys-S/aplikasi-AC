import React from 'react';
import './Profile.css';
import avatarImg from '../../assets/user_avatar.png'; // placeholder avatar

const UserProfile = () => {
  return (
    <div className="dashboard-container user-profile">
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
