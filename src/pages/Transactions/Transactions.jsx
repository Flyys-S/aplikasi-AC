import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, ShoppingBag, Globe, Store, Search, Loader2 } from 'lucide-react';
import { formatRupiah, formatTanggalJam } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';
import { getStatusLabel } from '../../lib/statusUtils';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import './Transactions.css';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);



  const filteredTransactions = transactions.filter(t => 
    (t.customers?.name || 'Umum').toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <TopHeader title="Transaksi" subtitle="Riwayat Penjualan Toko & Online">
        <div 
          className="icon-btn" 
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          onClick={() => navigate('/transactions/new')}
        >
          <Plus size={20} />
        </div>
      </TopHeader>

      <div className="page-content fade-in" style={{ paddingBottom: '100px' }}>
        <div className="search-input-wrapper card-elevation" style={{ marginBottom: '20px', backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', borderRadius: '12px', padding: '0 12px' }}>
          <Search size={18} color="#999" />
          <input 
            type="text" 
            placeholder="Cari transaksi atau pelanggan..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <InlineLoader text="Memuat data..." />
        ) : filteredTransactions.length > 0 ? (
          <div className="txn-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTransactions.map(txn => {
              const status = getStatusLabel(txn.status);
              return (
                <div 
                  key={txn.id} 
                  className="card-elevation" 
                  onClick={() => navigate(`/transactions/${txn.id}`)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    backgroundColor: 'var(--color-glass-bg)', 
                    border: '1px solid var(--color-glass-border)',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    backgroundColor: txn.is_online ? 'rgba(0, 85, 255, 0.1)' : 'rgba(107, 114, 128, 0.1)', 
                    color: txn.is_online ? 'var(--color-primary)' : '#888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {txn.is_online ? <Globe size={20} /> : <Store size={20} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-on-surface)' }}>{txn.customers?.name || 'Pelanggan Umum'}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-primary)' }}>
                        {formatRupiah(txn.total_amount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                        {formatTanggalJam(txn.created_at)}
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        backgroundColor: status.bg, 
                        color: status.color,
                        textTransform: 'uppercase',
                        border: `1px solid ${status.color}33`
                      }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#ccc" />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} text="Belum ada transaksi yang sesuai." />
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Transactions;

