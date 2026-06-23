import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Wrench, Eye, Trash2, Search, Plus, Bell, Sun, Moon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import InlineLoader from '../../components/InlineLoader';
import { useProfiles } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/activityLog';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const { profiles, loading, fetchProfiles, updateProfileRole } = useProfiles();
  const [updatingId, setUpdatingId] = useState(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    const targetUser = profiles.find(p => p.id === userId);
    const { error } = await updateProfileRole(userId, newRole);
    if (error) {
      toast.error('Gagal memperbarui role: ' + error.message);
    } else {
      toast.success('Role berhasil diperbarui');
      await logAdminActivity('UPDATE_USER_ROLE', `Admin mengubah role ${targetUser?.email || userId} dari ${targetUser?.role?.toUpperCase() || 'UNKNOWN'} menjadi ${newRole.toUpperCase()}`, { userId, oldRole: targetUser?.role, newRole });
    }
    setUpdatingId(null);
  };

  const handleDeleteUser = async (profileId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus hak akses pengguna ini?')) {
      try {
        const targetUser = profiles.find(p => p.id === profileId);
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profileId);
        
        if (error) throw error;
        toast.success('Pengguna berhasil dihapus');
        await logAdminActivity('DELETE_USER', `Admin menghapus hak akses pengguna: ${targetUser?.email || profileId}`, targetUser);
        fetchProfiles();
      } catch (err) {
        toast.error('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Get initial avatar
  const getHeaderInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'R';
  };

  // Count role statistics
  const adminCount = profiles.filter(p => p.role === 'admin').length;
  const technicianCount = profiles.filter(p => p.role === 'technician').length;
  const visitorCount = profiles.filter(p => p.role === 'visitor').length;
  const totalCount = profiles.length;

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const nameMatch = (p.full_name || 'Tanpa Nama').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const roleMatch = roleFilter === 'all' || p.role === roleFilter;

    return nameMatch && roleMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProfiles.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="dashboard-container">
      {/* 1. Header Halaman */}
      <TopHeader 
        title="Manajemen User" 
        subtitle="Kelola Hak Akses dan Peran Pengguna secara real-time"
      >
        <div className="user-mgmt-header-controls">
          {/* Tambah User */}
          <button 
            className="icon-btn" 
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            onClick={() => navigate('/signup')}
            title="Tambah User Baru"
          >
            <Plus size={20} />
          </button>

          {/* Toggle Dark Mode */}
          <button 
            className="icon-btn theme-toggle-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            style={{ width: '40px', height: '40px', background: 'var(--color-surface-container-low)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Bell Icon Notification */}
          <button 
            className="icon-btn notif-bell-btn" 
            title="Notifikasi"
            style={{ background: 'var(--color-surface-container-low)' }}
          >
            <Bell size={18} />
          </button>

          {/* User Avatar */}
          <div className="avatar-initial">
            {getHeaderInitial()}
          </div>
        </div>
      </TopHeader>

      <div className="page-content fade-in user-mgmt-container" style={{ paddingBottom: '100px' }}>
        
        {/* ⚡ 2. Summary Cards / Card Informasi */}
        <section className="summary-grid">
          {/* Card 1: Admin */}
          <div className="summary-card-mgmt">
            <div className="summary-icon-container" style={{ backgroundColor: 'rgba(0, 85, 255, 0.08)', color: 'var(--color-primary)' }}>
              <Shield size={22} />
            </div>
            <div>
              <div className="summary-val">{adminCount}</div>
              <div className="summary-label">Admin</div>
              <div className="summary-desc">Akses kontrol sistem penuh</div>
            </div>
          </div>

          {/* Card 2: Teknisi */}
          <div className="summary-card-mgmt">
            <div className="summary-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
              <Wrench size={22} />
            </div>
            <div>
              <div className="summary-val">{technicianCount}</div>
              <div className="summary-label">Technician</div>
              <div className="summary-desc">Akses modul servis & tugas</div>
            </div>
          </div>

          {/* Card 3: Visitor */}
          <div className="summary-card-mgmt">
            <div className="summary-icon-container" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#6366f1' }}>
              <Eye size={22} />
            </div>
            <div>
              <div className="summary-val">{visitorCount}</div>
              <div className="summary-label">Visitor</div>
              <div className="summary-desc">Akses lihat dasar (Read-only)</div>
            </div>
          </div>

          {/* Card 4: Total Users */}
          <div className="summary-card-mgmt">
            <div className="summary-icon-container" style={{ backgroundColor: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-on-surface-variant)' }}>
              <Users size={22} />
            </div>
            <div>
              <div className="summary-val">{totalCount}</div>
              <div className="summary-label">Total Pengguna</div>
              <div className="summary-desc">Semua akun terdaftar di sistem</div>
            </div>
          </div>
        </section>

        {/* 📋 3. Daftar Pengguna Section (Tabel Data) */}
        <section className="data-box">
          <div className="data-box-header">
            <h3 className="data-box-title">Daftar Pengguna</h3>
            
            <div className="search-filter-controls">
              {/* Search Bar */}
              <div className="search-input-wrapper card-elevation" style={{ maxWidth: '280px', margin: 0, padding: '0 12px' }}>
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau email..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Role Filter */}
              <select 
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select-custom"
                style={{ minWidth: '130px' }}
              >
                <option value="all">Semua Peran</option>
                <option value="admin">Admin</option>
                <option value="technician">Technician</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
          </div>

          <div className="table-responsive-custom">
            {loading ? (
              <InlineLoader text="Memuat data pengguna..." />
            ) : currentItems.length > 0 ? (
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th>Profil</th>
                    <th>Kontak</th>
                    <th>Status Profil</th>
                    <th>Hak Akses / Peran</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((profile) => {
                    const hasName = profile.full_name && profile.full_name.trim() !== '';
                    const initial = hasName ? profile.full_name.charAt(0).toUpperCase() : (profile.email ? profile.email.charAt(0).toUpperCase() : '?');
                    
                    // Contrast avatar background based on role
                    let avatarBg = '#6366f1'; // visitor
                    if (profile.role === 'admin') avatarBg = 'var(--color-primary)';
                    else if (profile.role === 'technician') avatarBg = '#10b981';

                    // Role select class name styling
                    let selectClass = 'role-select-visitor';
                    if (profile.role === 'admin') selectClass = 'role-select-admin';
                    else if (profile.role === 'technician') selectClass = 'role-select-technician';

                    return (
                      <tr key={profile.id}>
                        {/* Kolom 1: Profil */}
                        <td>
                          <div className="profile-cell-wrapper">
                            <div className="avatar-circle-sm" style={{ backgroundColor: avatarBg }}>
                              {initial}
                            </div>
                            <span 
                              className="user-name" 
                              style={{ 
                                fontWeight: '700',
                                fontStyle: hasName ? 'normal' : 'italic',
                                color: hasName ? 'var(--color-on-surface)' : 'var(--color-outline)'
                              }}
                            >
                              {profile.full_name || 'Tanpa Nama'}
                            </span>
                          </div>
                        </td>

                        {/* Kolom 2: Kontak */}
                        <td style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)' }}>
                          {profile.email || 'Email tidak tersedia'}
                        </td>

                        {/* Kolom 3: Status Profil */}
                        <td>
                          <span 
                            className="badge-custom"
                            style={{ 
                              backgroundColor: hasName ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                              color: hasName ? '#10b981' : '#f59e0b' 
                            }}
                          >
                            {hasName ? 'Terisi' : 'Belum Lengkap'}
                          </span>
                        </td>

                        {/* Kolom 4: Hak Akses / Peran */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select 
                              className={`role-dropdown-select ${selectClass}`}
                              value={profile.role || 'visitor'}
                              onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                              disabled={updatingId === profile.id}
                            >
                              <option value="admin">ADMIN</option>
                              <option value="technician">TECHNICIAN</option>
                              <option value="visitor">VISITOR</option>
                            </select>
                            {updatingId === profile.id && <Loader2 className="animate-spin" size={14} color="var(--color-primary)" />}
                          </div>
                        </td>

                        {/* Kolom 5: Aksi */}
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="icon-btn remove-btn"
                            onClick={() => handleDeleteUser(profile.id)}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Hapus Hak Akses"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={Users} text="Tidak ada pengguna yang cocok dengan pencarian / filter." />
            )}
          </div>

          {/* 4. Footer Pagination */}
          {filteredProfiles.length > 0 && (
            <div className="pagination-row">
              <span className="pagination-info">
                Menampilkan <strong>{currentItems.length}</strong> dari <strong>{filteredProfiles.length}</strong> Pengguna
              </span>
              <div className="pagination-buttons">
                <Button 
                  size="small" 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ height: '32px', fontSize: '12px', borderRadius: '8px' }}
                >
                  Sebelumnya
                </Button>
                <Button 
                  size="small" 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ height: '32px', fontSize: '12px', borderRadius: '8px' }}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </section>

      </div>

      <Navigation />
    </div>
  );
};

export default UserManagement;
