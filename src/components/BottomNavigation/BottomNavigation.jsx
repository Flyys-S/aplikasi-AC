import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen, HardHat } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './BottomNavigation.css'

const BottomNavigation = () => {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const isTechnician = role === 'technician'

  if (role === 'visitor') {
    return null
  }

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
