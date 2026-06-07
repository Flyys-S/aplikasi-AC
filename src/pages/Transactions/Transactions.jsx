import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Globe, Store, ChevronLeft, ChevronRight, Calendar, TrendingUp, ShoppingCart, Printer, Eye, Filter } from 'lucide-react';
import { formatRupiah, formatTanggalJam } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';
import { getStatusLabel } from '../../lib/statusUtils';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import './Transactions.css';

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    fetchTransactions();
  }, [fetchTransactions]);

  // Filtering Logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query Match
    const matchesSearch = 
      (t.customers?.name || 'Umum').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status Match
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    // 3. Channel Match
    const matchesChannel = 
      channelFilter === 'all' || 
      (channelFilter === 'online' && t.is_online) || 
      (channelFilter === 'store' && !t.is_online);

    // 4. Date Match
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(t.created_at) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.created_at) <= end;
    }

    return matchesSearch && matchesStatus && matchesChannel && matchesDate;
  });

  // Calculate KPIs
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.total_amount || 0), 0);

  const totalTxCount = transactions.length;

  const pendingOnlineOrders = transactions
    .filter(t => t.is_online && t.status === 'pending')
    .length;

  const onlineCount = transactions.filter(t => t.is_online).length;
  const storeCount = totalTxCount - onlineCount;
  const onlineRatio = totalTxCount > 0 ? Math.round((onlineCount / totalTxCount) * 100) : 0;
  const storeRatio = totalTxCount > 0 ? 100 - onlineRatio : 0;

  // Group last 7 days revenue for the area chart
  const getChartData = () => {
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = {
        label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        amount: 0
      };
    }

    transactions.forEach(t => {
      if (t.status === 'completed' && t.created_at) {
        const dateStr = t.created_at.split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].amount += t.total_amount || 0;
        }
      }
    });

    return Object.values(dailyData);
  };

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1000000); // Prevent division by zero
  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * 500;
    const y = 200 - (d.amount / maxAmount) * 150 - 20;
    return { x, y, label: d.label, amount: d.amount };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`
    : '';

  // Donut chart circles calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3
  const storePercent = totalTxCount > 0 ? (storeCount / totalTxCount) * 100 : 50;
  const onlinePercent = 100 - storePercent;
  const storeStrokeDash = (storePercent / 100) * circumference;

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="dashboard-container">
      <TopHeader title="Transaksi" subtitle="Riwayat Penjualan Toko & Online">
        <div 
          className="icon-btn" 
          style={{ backgroundColor: 'var(--color-primary)', color: 'white', transition: 'all 0.2s' }}
          onClick={() => navigate('/transactions/new')}
        >
          <Plus size={20} />
        </div>
      </TopHeader>

      <div className="page-content fade-in transactions-container" style={{ paddingBottom: '100px' }}>
        
        {/* 📊 1. Top Bar & Filter Section */}
        <section className="filter-card">
          <div className="search-filter-row">
            <div className="search-wrapper-large">
              <Search size={18} className="search-icon-left" />
              <input 
                type="text" 
                placeholder="Cari transaksi atau pelanggan..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="date-range-picker">
              <Calendar size={16} color="var(--color-on-surface-variant)" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="date-input-subtle"
              />
              <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>s/d</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="date-input-subtle"
              />
            </div>
          </div>

          <div className="quick-filters-row">
            <div className="filter-group">
              <span className="filter-label-subtle">Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select-custom"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="pending">Diproses</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label-subtle">Saluran:</span>
              <select 
                value={channelFilter} 
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select-custom"
              >
                <option value="all">Semua Saluran</option>
                <option value="store">Toko Fisik</option>
                <option value="online">Online Store</option>
              </select>
            </div>

            {(startDate || endDate || statusFilter !== 'all' || channelFilter !== 'all' || searchQuery) && (
              <Button 
                size="small" 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('all');
                  setChannelFilter('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                style={{ height: '36px', fontSize: '12px', borderRadius: '10px' }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        </section>

        {/* ⚡ 2. KPI Cards Section */}
        <section className="kpi-grid">
          {/* Revenue KPI */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Total Pendapatan</span>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="kpi-card-value">{formatRupiah(totalRevenue)}</div>
            <div className="kpi-card-desc">Dari transaksi berstatus Selesai</div>
          </div>

          {/* Sales Count KPI */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Total Transaksi</span>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(0, 85, 255, 0.08)', color: 'var(--color-primary)' }}>
                <ShoppingCart size={18} />
              </div>
            </div>
            <div className="kpi-card-value">{totalTxCount} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-on-surface-variant)' }}>Trx</span></div>
            <div className="kpi-card-desc">Volume penjualan keseluruhan</div>
          </div>

          {/* Online Processed KPI */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Online Diproses</span>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <Globe size={18} />
              </div>
            </div>
            <div className="kpi-card-value">{pendingOnlineOrders} <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-on-surface-variant)' }}>Pesanan</span></div>
            <div className="kpi-card-desc">Butuh verifikasi & pengiriman</div>
          </div>

          {/* Channel Ratio KPI */}
          <div className="kpi-card">
            <div className="kpi-card-header">
              <span className="kpi-card-title">Rasio Saluran</span>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(147, 51, 234, 0.08)', color: '#9333ea' }}>
                <Store size={18} />
              </div>
            </div>
            <div className="kpi-card-value" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: '900' }}>{storeRatio}%</span>
              <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>vs</span>
              <span style={{ color: '#9333ea', fontWeight: '900' }}>{onlineRatio}%</span>
            </div>
            <div className="kpi-card-desc">Toko Fisik vs Toko Online</div>
          </div>
        </section>

        {/* 📈 3. Visualization Charts Section */}
        <section className="charts-grid">
          {/* Revenue Trend Area Chart */}
          <div className="chart-card-wrapper">
            <div className="chart-card-header">
              <span className="chart-card-title">Tren Pendapatan Harian</span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: '700' }}>7 Hari Terakhir</span>
            </div>
            <div className="chart-container-inner">
              <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Gridlines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="var(--color-outline-variant)" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="var(--color-outline-variant)" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="var(--color-outline-variant)" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1="0" y1="170" x2="500" y2="170" stroke="var(--color-outline-variant)" strokeWidth="0.8" strokeDasharray="3,3" />

                {/* Area under the line */}
                {points.length > 0 && (
                  <path d={areaPath} fill="url(#chartGlow)" />
                )}

                {/* Main line */}
                {points.length > 0 && (
                  <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {/* Data Points and Value Tooltips */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill="var(--color-surface-container-lowest)" stroke="var(--color-primary)" strokeWidth="2.5" />
                    
                    {/* Tooltip value shown on point */}
                    {p.amount > 0 && (
                      <text x={p.x} y={p.y - 10} fontSize="8" fontWeight="800" textAnchor="middle" fill="var(--color-primary)">
                        {formatRupiah(p.amount).replace(',00', '').replace('Rp ', '')}
                      </text>
                    )}

                    {/* Date label at bottom */}
                    <text x={p.x} y="194" fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--color-on-surface-variant)">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Sales Channels Donut Chart */}
          <div className="chart-card-wrapper" style={{ justifyContent: 'center' }}>
            <div className="chart-card-header">
              <span className="chart-card-title">Saluran Penjualan</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--color-outline-variant)" strokeWidth="12" />
                
                {/* Toko Fisik segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent" 
                  stroke="var(--color-primary)" 
                  strokeWidth="12" 
                  strokeDasharray={`${storeStrokeDash} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />

                {/* Online Store segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent" 
                  stroke="#9333ea" 
                  strokeWidth="12" 
                  strokeDasharray={`${((100 - storePercent) / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-storeStrokeDash}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="donut-legend">
              <div className="legend-item">
                <div>
                  <span className="legend-color-dot" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                  <strong>Toko Fisik</strong>
                </div>
                <span>{storeCount} Trx ({storeRatio}%)</span>
              </div>
              <div className="legend-item">
                <div>
                  <span className="legend-color-dot" style={{ backgroundColor: '#9333ea' }}></span>
                  <strong>Toko Online</strong>
                </div>
                <span>{onlineCount} Trx ({onlineRatio}%)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 📋 4. Main Transaction Table Section */}
        <section className="table-card-wrapper">
          <div className="table-responsive-custom">
            {loading ? (
              <InlineLoader text="Memuat data transaksi..." />
            ) : currentItems.length > 0 ? (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>ID Transaksi</th>
                    <th>Tanggal & Waktu</th>
                    <th>Pelanggan</th>
                    <th>Saluran</th>
                    <th>Total Nominal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(txn => {
                    const status = getStatusLabel(txn.status);
                    return (
                      <tr key={txn.id}>
                        <td>
                          <span 
                            style={{ fontWeight: '800', color: 'var(--color-primary)', cursor: 'pointer' }}
                            onClick={() => navigate(`/transactions/${txn.id}`)}
                          >
                            #{txn.id.substring(0, 12).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-on-surface-variant)' }}>
                          {formatTanggalJam(txn.created_at)}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {txn.customers?.name || 'Pelanggan Umum'}
                        </td>
                        <td>
                          <span className={`badge-custom ${txn.is_online ? 'badge-channel-online' : 'badge-channel-store'}`}>
                            {txn.is_online ? <Globe size={11} /> : <Store size={11} />}
                            {txn.is_online ? 'Online' : 'Toko'}
                          </span>
                        </td>
                        <td style={{ fontWeight: '800', color: 'var(--color-primary)' }}>
                          {formatRupiah(txn.total_amount)}
                        </td>
                        <td>
                          <span className={`badge-custom`} style={{ backgroundColor: `${status.bg}`, color: `${status.color}` }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="icon-btn" 
                              onClick={() => navigate(`/transactions/${txn.id}`)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)', background: 'transparent' }}
                              title="Lihat Detail"
                            >
                              <Eye size={14} color="var(--color-on-surface)" />
                            </button>
                            <button 
                              className="icon-btn" 
                              onClick={() => window.print()}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)', background: 'transparent' }}
                              title="Cetak Struk"
                            >
                              <Printer size={14} color="var(--color-on-surface)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={ShoppingCart} text="Tidak ada transaksi yang cocok dengan filter aktif." />
            )}
          </div>

          {/* Pagination bar */}
          {filteredTransactions.length > 0 && (
            <div className="pagination-row">
              <span className="pagination-info">
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredTransactions.length} transaksi)
              </span>
              <div className="pagination-buttons">
                <Button 
                  size="small" 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ gap: '4px', height: '32px', fontSize: '12px', borderRadius: '8px' }}
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button 
                  size="small" 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ gap: '4px', height: '32px', fontSize: '12px', borderRadius: '8px' }}
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </section>

      </div>

      <Navigation />
    </div>
  );
};

export default Transactions;
