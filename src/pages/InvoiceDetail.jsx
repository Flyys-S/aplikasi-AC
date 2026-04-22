import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Share2 } from 'lucide-react'
import { useTransactions } from '../hooks/useSupabase'
import './InvoiceDetail.css'

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { transactions } = useTransactions()

  const txn = transactions.find(t => t.id === id)

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Invoice AC Retail',
        text: `Invoice #${id?.slice(-8).toUpperCase()} — Total: Rp ${txn?.total_amount?.toLocaleString('id-ID')}`,
      })
    }
  }

  if (!txn) {
    return (
      <div className="invoice-loading">
        <div className="loading-spinner"></div>
        <p>Memuat invoice...</p>
      </div>
    )
  }

  const date = new Date(txn.created_at)

  return (
    <div className="invoice-container fade-in">
      {/* Header */}
      <div className="invoice-nav">
        <button className="back-btn" onClick={() => navigate('/transactions')}><ArrowLeft size={22} /></button>
        <h2>Detail Invoice</h2>
        <button className="back-btn" onClick={handleShare}><Share2 size={20} /></button>
      </div>

      {/* Invoice Card */}
      <div className="invoice-card">
        {/* Company Header */}
        <div className="invoice-company">
          <div className="invoice-logo">AC</div>
          <div>
            <h3>AC Retail System</h3>
            <p>Sistem Manajemen Retail AC</p>
          </div>
        </div>

        <div className="invoice-divider" />

        {/* Invoice Info */}
        <div className="invoice-info-grid">
          <div className="invoice-info-item">
            <span className="info-label">No. Invoice</span>
            <span className="info-value">#{id?.slice(-8).toUpperCase()}</span>
          </div>
          <div className="invoice-info-item">
            <span className="info-label">Tanggal</span>
            <span className="info-value">
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="invoice-info-item">
            <span className="info-label">Pelanggan</span>
            <span className="info-value">{txn.customers?.name || 'Pelanggan Umum'}</span>
          </div>
          <div className="invoice-info-item">
            <span className="info-label">Pembayaran</span>
            <span className="info-value">{txn.payment_method}</span>
          </div>
          {txn.customers?.phone && (
            <div className="invoice-info-item" style={{ gridColumn: '1/-1' }}>
              <span className="info-label">No. HP</span>
              <span className="info-value">{txn.customers.phone}</span>
            </div>
          )}
        </div>

        <div className="invoice-divider" />

        {/* Items */}
        <div className="invoice-items">
          <div className="invoice-items-header">
            <span>Produk</span>
            <span>Qty</span>
            <span>Subtotal</span>
          </div>
          {(txn.transaction_items || []).map((item, idx) => (
            <div key={idx} className="invoice-item-row">
              <div className="item-name-col">
                <span className="item-name">{item.products?.name || 'Produk'}</span>
                <span className="item-brand">{item.products?.brand}</span>
                <span className="item-unit-price">@ Rp {item.unit_price?.toLocaleString('id-ID')}</span>
              </div>
              <span className="item-qty">{item.quantity}</span>
              <span className="item-subtotal">Rp {item.subtotal?.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div className="invoice-divider" />

        {/* Total */}
        <div className="invoice-total-section">
          <div className="invoice-total-row">
            <span>Subtotal</span>
            <span>Rp {txn.total_amount?.toLocaleString('id-ID')}</span>
          </div>
          <div className="invoice-total-row grand-total">
            <span>Total</span>
            <span>Rp {txn.total_amount?.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="invoice-status-badge">
          <CheckCircle size={16} color="#008756" />
          <span>Transaksi Berhasil</span>
        </div>

        {txn.notes && (
          <div className="invoice-notes">
            <span className="info-label">Catatan:</span>
            <span>{txn.notes}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="invoice-actions">
        <button className="btn-secondary" onClick={() => navigate('/transactions')}>
          Kembali ke Daftar
        </button>
        <button className="btn-primary" onClick={() => navigate('/transactions/new')}>
          + Transaksi Baru
        </button>
      </div>
    </div>
  )
}

export default InvoiceDetail
