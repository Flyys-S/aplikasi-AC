import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { formatTanggalJam } from '../../lib/formatters';
import { User, Mail, Shield, Calendar, Moon, Sun, Save, LogOut, Loader2, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button/Button';
import './Profile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, role, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    role: '',
    createdAt: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const timeout = (ms) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout koneksi database')), ms)
      );

      try {
        setLoading(true);
        // Fetch from profiles table with 10s timeout
        const { data, error } = await Promise.race([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
          timeout(10000)
        ]);

        if (error) {
          console.error('Error fetching profile:', error);
          // Fallback to Auth metadata
          setProfileData({
            fullName: user.user_metadata?.full_name || '',
            email: user.email || '',
            role: role || 'visitor',
            createdAt: user.created_at || '',
            phone: user.user_metadata?.phone || '',
            address: ''
          });
        } else if (data) {
          setProfileData({
            fullName: data.full_name || '',
            email: data.email || user.email || '',
            role: data.role || role || 'visitor',
            createdAt: data.created_at || user.created_at || '',
            phone: data.phone || '',
            address: data.address || ''
          });
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
        // Fallback to Auth metadata on catch
        setProfileData({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
          role: role || 'visitor',
          createdAt: user.created_at || '',
          phone: user.user_metadata?.phone || '',
          address: ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, role]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address
        })
        .eq('id', user.id);

      if (error) throw error;

      // Sync customer details for visitors
      if (role === 'visitor') {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (customer) {
          await supabase
            .from('customers')
            .update({ 
              name: profileData.fullName, 
              phone: profileData.phone, 
              address: profileData.address 
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('customers')
            .insert([{ 
              user_id: user.id, 
              name: profileData.fullName, 
              phone: profileData.phone, 
              address: profileData.address, 
              email: user.email 
            }]);
        }
      }

      await refreshProfile();
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Gagal memperbarui profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan`);
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      const cleanUrl = window.location.origin + import.meta.env.BASE_URL;
      window.history.replaceState(null, '', cleanUrl);
      navigate('/', { replace: true });
      setTimeout(() => {
        signOut();
      }, 100);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isVisitor = role === 'visitor';
  const hasNormalSidebar = role === 'admin' || role === 'technician';
  const containerClass = hasNormalSidebar ? '' : (isVisitor ? ' customer-layout' : ' guest-layout');

  return (
    <>
      <div className={`dashboard-container${containerClass}`}>
      <TopHeader title="Profil Saya" subtitle="Kelola informasi akun dan pengaturan aplikasi" />

      <div className="page-content fade-in profile-page-content">
        {loading ? (
          <div className="profile-loading">
            <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            <p>Memuat profil pengguna...</p>
          </div>
        ) : (
          <div className="profile-grid">
            {/* Left Card - User Card */}
            <div className="profile-card glass-panel text-center">
              <div className="avatar-wrapper">
                <div className="profile-avatar">
                  {getInitials(profileData.fullName || profileData.email)}
                </div>
                <div className={`role-tag-badge role-${profileData.role}`}>
                  <Shield size={12} />
                  <span>{profileData.role.toUpperCase()}</span>
                </div>
              </div>

              <h2 className="profile-display-name">{profileData.fullName || 'Tanpa Nama'}</h2>
              <p className="profile-display-email">{profileData.email}</p>

              <div className="profile-meta-list">
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon" />
                  <div className="meta-details">
                    <span className="meta-label">Bergabung Sejak</span>
                    <span className="meta-value">{formatTanggalJam(profileData.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="profile-card-footer">
                <Button
                  variant="outline-danger"
                  className="w-full justify-center"
                  onClick={handleLogout}
                >
                  <LogOut size={16} style={{ marginRight: '8px' }} />
                  Keluar dari Akun
                </Button>
              </div>
            </div>

            {/* Right Card - Form and Settings */}
            <div className="profile-details-column">
              {/* Profile Form */}
              <div className="profile-card glass-panel">
                <h3 className="card-section-title">Informasi Pribadi</h3>
                <form onSubmit={handleSave} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="fullName">Nama Lengkap</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Nomor Telepon</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Masukkan nomor telepon (e.g. 0812xxxxxxxx)"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Alamat Lengkap</label>
                    <div className="input-with-icon">
                      <MapPin size={18} className="input-icon" />
                      <input
                        type="text"
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        placeholder="Masukkan alamat lengkap pengiriman/pengerjaan"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Alamat Email</label>
                    <div className="input-with-icon disabled-input">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        value={profileData.email}
                        disabled
                        placeholder="email@example.com"
                      />
                    </div>
                    <span className="input-help">Email akun tidak dapat diubah</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">Akses Sistem</label>
                    <div className="input-with-icon disabled-input">
                      <Shield size={18} className="input-icon" />
                      <input
                        type="text"
                        id="role"
                        value={profileData.role.toUpperCase()}
                        disabled
                      />
                    </div>
                    <span className="input-help">Hubungi administrator untuk mengubah level akses</span>
                  </div>

                  <div className="form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                      className="save-profile-btn"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={16} style={{ marginRight: '8px' }} />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Theme Settings */}
              <div className="profile-card glass-panel">
                <h3 className="card-section-title">Preferensi Tampilan</h3>
                <p className="card-section-desc">Pilih tema visual yang paling nyaman bagi Anda.</p>
                <div className="theme-selector-grid">
                  <button
                    type="button"
                    className={`theme-option-card ${theme === 'light' ? 'theme-active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={24} className="theme-option-icon text-amber-500" />
                    <div className="theme-option-details">
                      <span className="theme-title">Mode Terang</span>
                      <span className="theme-desc">Tampilan bersih & kontras tinggi</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`theme-option-card ${theme === 'dark' ? 'theme-active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={24} className="theme-option-icon text-indigo-400" />
                    <div className="theme-option-details">
                      <span className="theme-title">Mode Gelap</span>
                      <span className="theme-desc">Nyaman untuk mata di tempat redup</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
      <Navigation />
    </>
  );
};

export default UserProfile;
