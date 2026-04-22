import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, Mail, ShoppingBag, Wrench } from 'lucide-react'
import BottomNavigation from '../components/BottomNavigation'
import { useCustomers, useTransactions, useServiceOrders } from '../hooks/useSupabase'
import './SalesDashboard.css'
import './CustomerDetail.css'

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customers } = useCustomers()
  const { transactions } = useTransactions()
  const { orders } = useServiceOrders()

  const customer = customers.find(c => c.id === id)
  const customerTxns = transactions.filter(t => t.customer_id === id)
  const customerOrders = orders.filter(o => o.customer_id === id)

  if (!customer) {
    return (
      <div className="dashboard-container fade-in">
        <div className="empty-state" style={{ minHeight: '100vh' }}>
          <div className="loading-spinner"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  const totalSpend = customerTxns.reduce((sum, t) => sum + t.total_amount, 0)

  return (
    <div className="dashboard-container fade-in">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <h2>Profil Pelanggan</h2>
        <div style={{ width: 40 }} />
      </header>

      <div className="page-content">
        {/* Customer Profile Card */}
        <div className="customer-profile-card card-elevation">
          <div className="profile-avatar">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{customer.name}</h2>
            <div className="profile-contact">
              <span><Phone size={14} /> {customer.phone}</span>
              {customer.email && <span><Mail size={14} /> {customer.email}</span>}
              <span><MapPin size={14} /> {customer.address}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="customer-stats">
          <div className="stat-pill card-elevation">
            <ShoppingBag size={18} color="var(--color-primary)" />
            <div>
              <span className="stat-pill-value">{customerTxns.length}</span>
              <span className="stat-pill-label">Transaksi</span>
            </div>
          </div>
          <div className="stat-pill card-elevation">
            <Wrench size={18} color="#008756" />
            <div>
              <span className="stat-pill-value">{customerOrders.length}</span>
              <span className="stat-pill-label">Servis</span>
            </div>
          </div>
          <div className="stat-pill card-elevation">
            <ShoppingBag size={18} color="#b57a00" />
            <div>
              <span className="stat-pill-value">Rp {(totalSpend / 1000000).toFixed(1)}Jt</span>
              <span className="stat-pill-label">Total Belanja</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <section className="recent-activity">
          <div className="section-header">
            <h3>Riwayat Transaksi</h3>
            <span className="link-text" onClick={() => navigate('/transactions/new')}>+ Baru</span>
          </div>
          {customerTxns.length === 0 ? (
            <div className="empty-state card-elevation" style={{ padding: '24px' }}>
              <p style={{ fontSize: 14 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <div className="activity-list card-elevation">
              {customerTxns.map(txn => (
                <div key={txn.id} className="activity-item"
                  onClick={() => navigate(`/transactions/${txn.id}`)}>
                  <div className="activity-details">
                    <span className="activity-title">
                      {txn.transaction_items?.length || 0} item — {txn.payment_method}
                    </span>
                    <span className="activity-time">
                      {new Date(txn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 14 }}>
                    Rp {txn.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Service History */}
        <section className="recent-activity" style={{ marginTop: 'var(--space-md)' }}>
          <div className="section-header">
            <h3>Riwayat Servis</h3>
          </div>
          {customerOrders.length === 0 ? (
            <div className="empty-state card-elevation" style={{ padding: '24px' }}>
              <p style={{ fontSize: 14 }}>Belum ada riwayat servis</p>
            </div>
          ) : (
            <div className="activity-list card-elevation">
              {customerOrders.map(order => (
                <div key={order.id} className="activity-item">
                  <div className="activity-details">
                    <span className="activity-title">{order.service_type}</span>
                    <span className="activity-time">
                      {new Date(order.scheduled_date).toLocaleDateString('id-ID')} · {order.technician_name || 'Belum ditentukan'}
                    </span>
                  </div>
                  <span className={`activity-status ${order.status === 'completed' ? 'success' : ''}`}>
                    {order.status === 'completed' ? 'Selesai' : order.status === 'in_progress' ? 'Proses' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default CustomerDetail
