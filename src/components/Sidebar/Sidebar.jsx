import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen, LogOut, HardHat, Calculator, User, FileText } from 'lucide-react'
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

  useEffect(() => {
    document.body.classList.remove('sidebar-open')
  }, [location.pathname])

  const frontEndRoutes = ['/', '/catalog', '/admin-catalog', '/tools', '/company', '/login', '/signup', '/checkout', '/service-order', '/admin/reports', '/technician/report']
  if (frontEndRoutes.includes(location.pathname)) {
    if (role === 'admin' && (location.pathname === '/' || location.pathname === '/catalog' || location.pathname === '/admin-catalog' || location.pathname === '/admin/reports')) {
      // Render sidebar for admin
    } else if ((role === 'technician' || role === 'admin') && location.pathname === '/technician/report') {
      // Render sidebar for technician report
    } else if ((role === 'visitor' || !user) && ['/', '/catalog', '/tools', '/service-order'].includes(location.pathname)) {
      // Render sidebar for visitor or guest
    } else {
      return null
    }
  }

  const handleLogout = async () => {
    setShowConfirm(false)
    const cleanUrl = window.location.origin + import.meta.env.BASE_URL
    window.history.replaceState(null, '', cleanUrl)
    navigate('/', { replace: true })
    setTimeout(() => {
      signOut()
    }, 100)
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A'

  const isGuest = !user;
  const navItems = [
    ...(isAdmin ? [{ to: '/dashboard', label: 'Beranda', icon: LayoutDashboard }] : []),
    ...((role === 'visitor' || isGuest) ? [{ to: '/', label: 'Beranda', icon: LayoutDashboard }] : []),
    { to: isAdmin ? '/admin-catalog' : ((role === 'visitor' || isGuest) ? '/catalog' : '/'), label: 'Katalog', icon: BookOpen },
    ...(isAdmin ? [{ to: '/inventory', label: 'Stok', icon: Package }] : []),
    ...(!isTechnician && role !== 'visitor' && !isGuest ? [{ to: '/transactions', label: 'Transaksi', icon: ShoppingBag }] : []),
    ...((role === 'visitor' || isGuest) ? [{ to: '/tools', label: 'Kalkulator', icon: Calculator }] : []),
    ...(isAdmin ? [{ to: '/admin/reports', label: 'Laporan Servis', icon: FileText }] : []),
    ...(isAdmin ? [{ to: '/users', label: 'Akses', icon: ShieldCheck }] : []),
    ...((role === 'visitor' || isGuest) ? [{ to: '/service-order', label: 'Servis', icon: Wrench }] : (role !== 'visitor' && !isGuest ? [{ to: '/service', label: 'Servis', icon: Wrench }] : [])),
    ...(isTechnician || isAdmin ? [{ to: '/technician', label: 'Tugas Saya', icon: HardHat }] : []),
    ...((role === 'visitor' || isGuest) ? [{ to: '/profile', label: 'Profil Saya', icon: User }] : []),
  ]

  return (
    <>
      <div className="sidebar-backdrop" onClick={() => document.body.classList.remove('sidebar-open')}></div>
      <aside className={`sidebar-nav glass-panel ${(role === 'visitor' || !user) ? 'customer-sidebar' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">❄️</span>
            <div className="logo-text">
              <h3>MITRA MAJU SEJATI</h3>
              <span className="logo-badge">{role?.toUpperCase() || 'GUEST'}</span>
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
                onClick={() => document.body.classList.remove('sidebar-open')}
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
          {user ? (
            <>
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
            </>
          ) : (
            <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
              <Button variant="primary" style={{ width: '100%', height: '36px', fontSize: '13px' }} onClick={() => navigate('/login')}>
                Masuk / Login
              </Button>
            </div>
          )}
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
