import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, MapPin, ChevronRight, Users } from 'lucide-react'
import InlineLoader from '../../components/InlineLoader'
import EmptyState from '../../components/EmptyState'
import TopHeader from '../../components/TopHeader'
import BottomNavigation from '../../components/BottomNavigation'
import CustomerModal from '../../components/CustomerModal'
import { useCustomers } from '../../hooks/useSupabase'
import '../SalesDashboard/SalesDashboard.css'
import './Customers.css'

const Customers = () => {
  const navigate = useNavigate()
  const { customers, loading, createCustomer } = useCustomers()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Pelanggan" subtitle={`${customers.length} pelanggan terdaftar`}>
        <div className="icon-btn" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          onClick={() => setShowModal(true)}>
          <Plus size={20} />
        </div>
      </TopHeader>

      <div className="page-content">
        <div className="search-input-wrapper card-elevation" style={{ marginBottom: 'var(--space-md)' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <InlineLoader text="Memuat data pelanggan..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} text="Belum ada pelanggan" subtext="Klik tombol + untuk menambahkan pelanggan baru" />
        ) : (
          <div className="customers-list">
            {filtered.map(customer => (
              <div key={customer.id} className="customer-card card-elevation"
                onClick={() => navigate(`/customers/${customer.id}`)}>
                <div className="customer-avatar">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-info">
                  <span className="customer-name">{customer.name}</span>
                  <span className="customer-detail"><Phone size={12} /> {customer.phone}</span>
                  <span className="customer-detail"><MapPin size={12} /> {customer.address}</span>
                </div>
                <ChevronRight size={18} className="chevron-icon" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            await createCustomer(data)
            setShowModal(false)
          }}
        />
      )}

      <BottomNavigation />
    </div>
  )
}

export default Customers


