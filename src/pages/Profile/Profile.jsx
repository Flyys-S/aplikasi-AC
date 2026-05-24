import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, LogOut, ChevronRight, Settings, Info, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import TopHeader from '../../components/TopHeader'
import '../../pages/Profile/Profile.css'
import Navigation from '../../components/Navigation';

const Profile = () => {
  const navigate = useNavigate()
  const { user, role, signOut, isAdmin } = useAuth()

  // Initialize Dark Mode state based on current DOM setting
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark'
  })

  // Listen to external theme changes (like OS changes or instant loads)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      setIsDark(currentTheme === 'dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
    setIsDark(!isDark)
  }

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut()
      navigate('/')
    }
  }

  const menuItems = [
    { 
      title: 'Informasi Akun', 
      icon: <User size={20} />, 
      subtitle: user?.email,
      action: () => {} 
    },
    { 
      title: 'Manajemen Pengguna', 
      icon: <Shield size={20} />, 
      subtitle: 'Kelola akses teknisi & admin',
      show: isAdmin,
      action: () => navigate('/users')
    },
    { 
      title: 'Tentang Aplikasi', 
      icon: <Info size={20} />, 
      subtitle: 'Versi 1.2.0 (Premium)',
      action: () => {} 
    }
  ]

  return (
    <div className="dashboard-container">
      <TopHeader title="Pengaturan Sistem" subtitle="Manajemen Akun, Preferensi & Aplikasi" />

      <div className="page-content fade-in" style={{ paddingBottom: '100px' }}>
        <div className="profile-header">
          <img src={require('../../assets/profile_header.png')} alt="Header" className="profile-header-image" />
          <div className="profile-header-overlay">
            <h1 className="profile-company-name">PT. MITRA MAJU SEJATI</h1>
            <p className="profile-user-role">{role || 'Visitor'}</p>
          </div>
        </div>

        {/* Settings Menu List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 🌓 DARK MODE SETTING ROW (Awwwards-Tier Premium Switch) */}
          <div 
            className="card-elevation" 
            onClick={toggleTheme}
            style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'var(--color-surface-container-lowest)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              cursor: 'pointer',
              border: '1px solid var(--color-outline-variant)'
            }}
          >
            <div style={{ 
              padding: '10px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--color-surface-container-low)', 
              color: isDark ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              transition: 'var(--transition-premium)'
            }}>
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-on-surface)' }}>
                Mode Gelap (Dark Mode)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                {isDark ? 'Mengaktifkan tema visual es dingin redup' : 'Mengaktifkan tema visual es putih bersih'}
              </span>
            </div>
            
            {/* Premium Toggler Switch */}
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              backgroundColor: isDark ? 'var(--color-primary)' : 'var(--color-outline-variant)',
              padding: '3px',
              transition: 'var(--transition-premium)',
              position: 'relative',
              boxShadow: isDark ? '0 2px 8px rgba(0, 85, 255, 0.3)' : 'none'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transform: isDark ? 'translateX(20px)' : 'translateX(0)',
                transition: 'var(--transition-premium)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />
            </div>
          </div>

          {menuItems.map((item, idx) => {
            if (item.show === false) return null
            return (
              <div 
                key={idx} 
                className="card-elevation" 
                onClick={item.action}
                style={{ 
                  padding: '16px', 
                  borderRadius: '16px', 
                  backgroundColor: 'var(--color-surface-container-lowest)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  cursor: item.action === undefined ? 'default' : 'pointer',
                  border: '1px solid var(--color-outline-variant)'
                }}
              >
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '12px', 
                  backgroundColor: 'var(--color-surface-container-low)', 
                  color: 'var(--color-on-surface-variant)' 
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-on-surface)' }}>{item.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>{item.subtitle}</span>
                </div>
                {item.action !== undefined && <ChevronRight size={16} color="var(--color-outline)" />}
              </div>
            )
          })}

          {/* Logout Button */}
          <div 
            className="card-elevation" 
            onClick={handleLogout}
            style={{ 
              marginTop: '12px',
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'rgba(255, 68, 68, 0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 68, 68, 0.1)'
            }}
          >
            <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(255, 68, 68, 0.08)', color: '#ff4444' }}>
              <LogOut size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#ff4444' }}>Keluar Akun</span>
              <span style={{ fontSize: '11px', color: '#ff7777' }}>Akhiri sesi login manajemen Anda</span>
            </div>
            <ChevronRight size={16} color="#ff8888" />
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

export default Profile

