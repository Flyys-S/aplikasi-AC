import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Mail, ShoppingBag, Wrench, Loader2, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import './CustomerDetail.css';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [serviceJobs, setServiceJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      const [custRes, txnRes, jobRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id).single(),
        supabase.from('transactions').select('*, items:transaction_items(*)').eq('customer_id', id).order('created_at', { ascending: false }),
        supabase.from('service_jobs').select('*').eq('customer_id', id).order('created_at', { ascending: false })
      ]);

      if (custRes.error) throw custRes.error;
      
      setCustomer(custRes.data);
      setTransactions(txnRes.data || []);
      setServiceJobs(jobRes.data || []);
    } catch (error) {
      console.error('Error fetching customer details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '12px', color: '#666' }}>Memuat profil pelanggan...</p>
        </div>
      </div>
    );
  }

  const totalSpend = transactions.reduce((sum, t) => sum + t.total_amount, 0);

  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Profil Pelanggan" subtitle="Detail & Riwayat Aktivitas" />

      <div className="page-content" style={{ paddingBottom: '100px' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={24} /> Kembali
        </button>

        {/* Profile Card */}
        <div className="card-elevation" style={{ padding: '24px', borderRadius: '20px', backgroundColor: 'white', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
            {customer.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{customer.name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#666', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {customer.phone}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {customer.address}</span>
              {customer.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {customer.email}</span>}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="card-elevation" style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'white', textAlign: 'center' }}>
            <ShoppingBag size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{transactions.length}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>Transaksi</span>
          </div>
          <div className="card-elevation" style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'white', textAlign: 'center' }}>
            <Wrench size={24} color="#008756" style={{ margin: '0 auto 8px' }} />
            <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{serviceJobs.length}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>Servis</span>
          </div>
          <div className="card-elevation" style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'white', textAlign: 'center' }}>
            <Calendar size={24} color="#f5a623" style={{ margin: '0 auto 8px' }} />
            <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(totalSpend)}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>Total Belanja</span>
          </div>
        </div>

        {/* Tabs for History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Riwayat Transaksi</h3>
              <button 
                onClick={() => navigate('/transactions/new')}
                style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px' }}
              >
                + Transaksi Baru
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {transactions.length > 0 ? (
                transactions.map(txn => (
                  <div 
                    key={txn.id} 
                    className="card-elevation" 
                    onClick={() => navigate(`/transactions/${txn.id}`)}
                    style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{txn.items?.length || 0} Produk</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>{new Date(txn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(txn.total_amount)}</span>
                      <ChevronRight size={18} color="#ccc" />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', borderRadius: '16px' }}>
                  Belum ada transaksi tercatat.
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Riwayat Servis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {serviceJobs.length > 0 ? (
                serviceJobs.map(job => (
                  <div 
                    key={job.id} 
                    className="card-elevation"
                    style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{job.service_type}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>{new Date(job.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      backgroundColor: job.status === 'completed' ? 'rgba(0,135,86,0.1)' : 'rgba(245,166,35,0.1)', 
                      color: job.status === 'completed' ? '#008756' : '#f5a623',
                      textTransform: 'uppercase'
                    }}>
                      {job.status === 'completed' ? 'Selesai' : job.status === 'in_progress' ? 'Proses' : 'Menunggu'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', borderRadius: '16px' }}>
                  Belum ada riwayat servis.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CustomerDetail;
