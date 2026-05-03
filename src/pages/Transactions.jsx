import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ShoppingBag } from 'lucide-react'
import TopHeader from '../components/TopHeader'
import BottomNavigation from '../components/BottomNavigation'
import { useTransactions } from '../hooks/useSupabase'
import './SalesDashboard.css'
import './Transactions.css'

const statusMap = {
  completed: { label: 'Selesai', type: 'success' },
  pending: { label: 'Pending', type: 'warning' },
  cancelled: { label: 'Batal', type: 'error' },
}

const Transactions = () => {
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions()

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Transaksi" subtitle={`${transactions.length} transaksi tercatat`}>
        <div className="icon-btn" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          onClick={() => navigate('/transactions/new')}>
          <Plus size={20} />
        </div>
      </TopHeader>

      <div className="page-content">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }}></div>
            <p>Memuat transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state card-elevation">
            <span>🧾</span>
            <p>Belum ada transaksi</p>
            <small>Klik tombol + untuk membuat transaksi baru</small>
          </div>
        ) : (
          <div className="txn-list">
            {transactions.map(txn => {
              const st = statusMap[txn.status] || statusMap.completed
              return (
                <div key={txn.id} className="txn-card card-elevation"
                  onClick={() => navigate(`/transactions/${txn.id}`)}>
                  <div className="txn-icon">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="txn-info">
                    <span className="txn-customer">
                      {txn.customers?.name || 'Pelanggan Umum'}
                    </span>
                    <span className="txn-meta">
                      {txn.transaction_items?.length || 0} item · {txn.payment_method}
                    </span>
                    <span className="txn-date">
                      {new Date(txn.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="txn-right">
                    <span className="txn-amount">Rp {txn.total_amount.toLocaleString('id-ID')}</span>
                    <span className={`txn-status status-${st.type}`}>{st.label}</span>
                  </div>
                  <ChevronRight size={16} color="var(--color-outline)" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Transactions
