import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Wrench, Users, ShoppingBag } from 'lucide-react'
import './BottomNavigation.css'

const BottomNavigation = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Package size={22} />
        <span>Stok</span>
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingBag size={22} />
        <span>Transaksi</span>
      </NavLink>
      <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Users size={22} />
        <span>Pelanggan</span>
      </NavLink>
      <NavLink to="/service" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Wrench size={22} />
        <span>Servis</span>
      </NavLink>
    </nav>
  )
}

export default BottomNavigation
