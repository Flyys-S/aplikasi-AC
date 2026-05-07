import React, { useState } from 'react';
import { Users, Shield, User as UserIcon, Check, Loader2 } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useProfiles } from '../hooks/useSupabase';
import './SalesDashboard.css';
import './UserManagement.css';

const UserManagement = () => {
  const { profiles, loading, error, updateProfileRole } = useProfiles();
  const [updatingId, setUpdatingId] = useState(null);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    const { error } = await updateProfileRole(userId, newRole);
    if (error) {
      alert('Gagal memperbarui role: ' + error.message);
    }
    setUpdatingId(null);
  };

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Manajemen User" subtitle="Kelola Akses dan Peran Pengguna" />

      <div className="page-content">
        <div className="user-management-container">
          <div className="user-management-header">
            <h2>Daftar Pengguna</h2>
            <p>Total {profiles.length} pengguna terdaftar di sistem</p>
          </div>

          {loading && profiles.length === 0 ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={32} />
              <p>Memuat data pengguna...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Terjadi kesalahan: {error.message}</p>
            </div>
          ) : (
            <div className="users-list">
              {profiles.map((profile) => (
                <div key={profile.id} className="user-card">
                  <div className="user-main-info">
                    <div className="user-avatar">
                      {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : '?')}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{profile.full_name || 'Tanpa Nama'}</span>
                      <span className="user-email">{profile.email || 'Email tidak tersedia'}</span>
                    </div>
                  </div>

                  <div className="user-actions">
                    <div className={`role-badge ${profile.role === 'admin' ? 'role-admin' : 'role-technician'}`}>
                      {profile.role === 'admin' ? <Shield size={12} style={{marginRight: '4px'}} /> : <UserIcon size={12} style={{marginRight: '4px'}} />}
                      {profile.role}
                    </div>

                    <select 
                      className="role-select"
                      value={profile.role}
                      onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                      disabled={updatingId === profile.id}
                    >
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>

                    {updatingId === profile.id && <Loader2 className="animate-spin" size={16} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UserManagement;
