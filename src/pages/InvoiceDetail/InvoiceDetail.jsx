import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Share2, Printer, Loader2, Download, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatAngka, formatTanggal } from '../../lib/formatters';
import Button from '../../components/Button';
import './InvoiceDetail.css';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    if (!loading && txn && searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, txn, searchParams]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Invoice PT. MITRA MAJU SEJATI',
        text: `Invoice #${id?.slice(-8).toUpperCase()} - Total: ${formatRupiah(txn?.total_amount)}`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <Loader2 className="spinner" size={32} />
        <p>Memuat invoice...</p>
      </div>
    );
  }

  if (!txn) return <div className="page-content fade-in">Invoice tidak ditemukan.</div>;

  return (
    <div className="invoice-container fade-in">
      <div className="invoice-nav">
        <button className="icon-btn" onClick={() => navigate('/transactions')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Detail Invoice</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={handleShare}><Share2 size={18} /></button>
          <button className="icon-btn" onClick={() => window.print()}><Printer size={18} /></button>
        </div>
      </div>

      <div className="invoice-card card-elevation">
        <div className="invoice-company">
          <div className="invoice-logo">AC</div>
          <div>
            <h3>PT. MITRA MAJU SEJATI</h3>
            <p>Premium AC Service & Retail</p>
          </div>
          <div className="invoice-badge">
            #{id?.slice(-8).toUpperCase()}
          </div>
        </div>

        <div className="invoice-divider" />

        <div className="invoice-info-grid">
          <div className="invoice-info-item">
            <span className="info-label">Tanggal</span>
            <span className="info-value">{formatTanggal(txn.created_at)}</span>
          </div>
          <div className="invoice-info-item">
            <span className="info-label">Metode Bayar</span>
            <span className="info-value" style={{ textTransform: 'capitalize' }}>{txn.payment_method}</span>
          </div>
          <div className="invoice-info-item" style={{ gridColumn: 'span 2' }}>
            <span className="info-label">Pelanggan</span>
            <span className="info-value">{txn.customers?.name || 'Pelanggan Umum'}</span>
            <span className="info-value" style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-outline)' }}>{txn.customers?.phone}</span>
          </div>
        </div>

        <div className="invoice-divider" />

        <div className="invoice-items">
          <div className="invoice-items-header">
            <span>Deskripsi</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          {txn.items?.map((item, idx) => (
            <div key={idx} className="invoice-item-row">
              <div className="item-name-col">
                <span className="item-name">{item.products?.name}</span>
                <span className="item-unit-price">@ {formatAngka(item.unit_price)}</span>
              </div>
              <span className="item-qty">{item.quantity}</span>
              <span className="item-subtotal">{formatAngka(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="invoice-divider" />

        <div className="invoice-total-section">
          <div className="invoice-total-row">
            <span>Subtotal</span>
            <span>{formatAngka(txn.total_amount)}</span>
          </div>
          <div className="invoice-total-row grand-total">
            <span>Total Bayar</span>
            <span>{formatRupiah(txn.total_amount)}</span>
          </div>
        </div>

        <div className="invoice-status-badge">
          <CheckCircle size={20} color="#008756" />
          <span>TRANSAKSI BERHASIL</span>
        </div>
      </div>

      <div className="invoice-actions-footer">
        <Button variant="outline" onClick={() => navigate('/transactions')}>
          Tutup
        </Button>
        <Button icon={PlusCircle} onClick={() => navigate('/transactions/new')}>
          Transaksi Baru
        </Button>
      </div>
    </div>
  );
};

export default InvoiceDetail;

