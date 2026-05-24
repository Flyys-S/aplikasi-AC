import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Share2, Printer, Loader2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatAngka, formatTanggal } from '../../lib/formatters';
import './InvoiceDetail.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name, phone, address),
          items:transaction_items(
            *,
            products(name, brand)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTxn(data);
    } catch (error) {
      console.error('Error fetching invoice:', error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransaction();
    }, 0);
    return () => clearTimeout(timer);
  }, [id, fetchTransaction]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Invoice Arctic Clarity',
        text: `Invoice #${id?.slice(-8).toUpperCase()} - Total: ${formatRupiah(txn?.total_amount)}`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '12px', color: '#666' }}>Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (!txn) return <div className="page-content">Invoice tidak ditemukan.</div>;

  return (
    <div className="invoice-container fade-in">
      <div className="invoice-nav">
        <button className="back-btn" onClick={() => navigate('/transactions')}>
          <ArrowLeft size={22} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Detail Invoice</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="back-btn" onClick={handleShare}><Share2 size={20} /></button>
          <button className="back-btn" onClick={() => window.print()}><Printer size={20} /></button>
        </div>
      </div>

      <div className="invoice-card card-elevation">
        <div className="invoice-header-branding">
          <div className="brand-logo">AC</div>
          <div className="brand-text">
            <h3>Arctic Clarity</h3>
            <p>Premium AC Service & Retail</p>
          </div>
          <div className="invoice-badge">
            #{id?.slice(-8).toUpperCase()}
          </div>
        </div>

        <div className="invoice-divider" />

        <div className="invoice-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Tanggal</span>
            <span className="meta-value">{formatTanggal(txn.created_at)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Metode Bayar</span>
            <span className="meta-value" style={{ textTransform: 'capitalize' }}>{txn.payment_method}</span>
          </div>
          <div className="meta-item" style={{ gridColumn: 'span 2' }}>
            <span className="meta-label">Pelanggan</span>
            <span className="meta-value">{txn.customers?.name || 'Pelanggan Umum'}</span>
            <span className="meta-subtext">{txn.customers?.phone}</span>
          </div>
        </div>

        <div className="invoice-divider" />

        <div className="invoice-items-table">
          <div className="table-header">
            <span className="col-desc">Deskripsi</span>
            <span className="col-qty">Qty</span>
            <span className="col-total">Total</span>
          </div>
          {txn.items?.map((item, idx) => (
            <div key={idx} className="table-row">
              <div className="col-desc">
                <span className="item-name">{item.products?.name}</span>
                <span className="item-unit">@ {formatAngka(item.unit_price)}</span>
              </div>
              <span className="col-qty">{item.quantity}</span>
              <span className="col-total">{formatAngka(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="invoice-divider" />

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatAngka(txn.total_amount)}</span>
          </div>
          <div className="summary-row grand-total">
            <span>Total Bayar</span>
            <span>{formatRupiah(txn.total_amount)}</span>
          </div>
        </div>

        <div className="invoice-footer-status">
          <div className="status-indicator">
            <CheckCircle size={20} color="#008756" />
            <span>TRANSAKSI BERHASIL</span>
          </div>
          <p>Terima kasih telah mempercayakan AC Anda kepada kami.</p>
        </div>
      </div>

      <div className="invoice-actions-footer">
        <button className="btn-secondary" onClick={() => navigate('/transactions')}>
          Tutup
        </button>
        <button className="btn-primary" onClick={() => navigate('/transactions/new')}>
          Transaksi Baru
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetail;

