import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './BottomNavigation.css'

const BottomNavigation = () => {
  const { role, signOut, user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = role === 'admin'

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut()
    }
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A'

  // Navigation items array to keep things clean and modular
  const navItems = [
    { to: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
    { to: '/catalog', label: 'Katalog', icon: BookOpen },
    ...(isAdmin ? [{ to: '/inventory', label: 'Stok', icon: Package }] : []),
    { to: '/transactions', label: 'Transaksi', icon: ShoppingBag },
    ...(isAdmin ? [{ to: '/users', label: 'Akses', icon: ShieldCheck }] : []),
    { to: '/service', label: 'Servis', icon: Wrench },
  ]

  return (
    <>
      {/* ðŸ“± MOBILE VIEW: Bottom Navigation Bar */}
      <nav className="bottom-nav">
        {navItems.map((item, index) => {
          const IconComponent = item.icon
          return (
            <NavLink
              key={index}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent size={22} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* ðŸ’» DESKTOP VIEW: Left Floating Sidebar Nav */}
      <aside className="sidebar-nav glass-panel">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">â„ï¸</span>
            <div className="logo-text">
              <h3>Arctic Clarity</h3>
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
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}

export default BottomNavigation

