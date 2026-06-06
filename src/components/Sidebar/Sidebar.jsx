import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen, LogOut, HardHat } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../Button'
import './Sidebar.css'

const Sidebar = () => {
  const { role, signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showConfirm, setShowConfirm] = useState(false)
  const isAdmin = role === 'admin'
  const isTechnician = role === 'technician'

  const frontEndRoutes = ['/', '/catalog', '/tools', '/company', '/login', '/signup', '/checkout', '/visitor-home']
  if (frontEndRoutes.includes(location.pathname)) {
    return null
  }

  const handleLogout = async () => {
    setShowConfirm(false)
    const cleanUrl = window.location.origin + import.meta.env.BASE_URL
    window.history.replaceState(null, '', cleanUrl)
    navigate('./Catalog', { replace: true })
    setTimeout(() => {
      signOut()
    }, 100)
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A'

  const navItems = [
    ...(isAdmin ? [{ to: '/dashboard', label: 'Beranda', icon: LayoutDashboard }] : []),
    { to: '/', label: 'Katalog', icon: BookOpen },
    ...(isAdmin ? [{ to: '/inventory', label: 'Stok', icon: Package }] : []),
    ...(!isTechnician ? [{ to: '/transactions', label: 'Transaksi', icon: ShoppingBag }] : []),
    ...(isAdmin ? [{ to: '/users', label: 'Akses', icon: ShieldCheck }] : []),
    { to: '/service', label: 'Servis', icon: Wrench },
    ...(isTechnician || isAdmin ? [{ to: '/technician', label: 'Tugas Saya', icon: HardHat }] : []),
  ]

  return (
    <>
      <aside className="sidebar-nav glass-panel">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">❄️</span>
            <div className="logo-text">
              <h3>MITRA MAJU SEJATI</h3>
              <span className="logo-badge">{role?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-menu">
          {navItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={index}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <div className="icon-wrapper">
                  <IconComponent size={20} />
                </div>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <span className="user-email">{user?.email?.split('@')[0]}</span>
              <span className="user-role">{role}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={() => setShowConfirm(true)} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Custom Premium Glassmorphic Confirmation Modal */}
      {showConfirm && (
        <div className="mms-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="mms-modal-card glass-panel" onClick={e => e.stopPropagation()}>
            <div className="mms-modal-icon-wrapper">
              <LogOut size={32} />
            </div>
            <h3 className="mms-modal-title">Konfirmasi Keluar</h3>
            <p className="mms-modal-message">
              Apakah Anda yakin ingin keluar dari sistem tata udara MITRA MAJU SEJATI saat ini?
            </p>
            <div className="mms-modal-actions">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Batal
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
