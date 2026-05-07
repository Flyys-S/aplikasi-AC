import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, ShieldCheck, ShoppingBag, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './BottomNavigation.css'

const BottomNavigation = () => {
  const { isAdmin, role } = useAuth()
  console.log('BottomNavigation Render - Role:', role, 'isAdmin:', isAdmin)

  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Beranda</span>
      </NavLink>

      <NavLink to="/catalog" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BookOpen size={22} />
        <span>Katalog</span>
      </NavLink>

      {isAdmin && (
        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={22} />
          <span>Stok</span>
        </NavLink>
      )}

      <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingBag size={22} />
        <span>Transaksi</span>
      </NavLink>

      {isAdmin && (
        <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={22} />
          <span>Akses</span>
        </NavLink>
      )}

      <NavLink to="/service" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Wrench size={22} />
        <span>Servis</span>
      </NavLink>
    </nav>
  )
}

export default BottomNavigation
