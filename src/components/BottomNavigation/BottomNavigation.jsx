import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './BottomNavigation.css'

const BottomNavigation = () => {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const navItems = [
    { to: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
    { to: '/', label: 'Katalog', icon: BookOpen },
    ...(isAdmin ? [{ to: '/inventory', label: 'Stok', icon: Package }] : []),
    { to: '/transactions', label: 'Transaksi', icon: ShoppingBag },
    ...(isAdmin ? [{ to: '/users', label: 'Akses', icon: ShieldCheck }] : []),
    { to: '/service', label: 'Servis', icon: Wrench },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item, index) => {
        const IconComponent = item.icon
        return (
          <NavLink
            key={index}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <IconComponent size={22} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNavigation
