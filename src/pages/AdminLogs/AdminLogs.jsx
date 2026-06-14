import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Search, Calendar, ChevronDown, ChevronUp, Loader2, Database, ShieldAlert, RefreshCw } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import toast from 'react-hot-toast';
import './AdminLogs.css';

const AdminLogs = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error('Error fetching activity logs:', e);
      toast.error('Gagal mengambil data log: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeClass = (action) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'badge-danger';
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) return 'badge-success';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'badge-warning';
    return 'badge-info';
  };

  const actionTypes = ['ALL', ...new Set(logs.map(log => log.action_type))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.admin_email && log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedActionType === 'ALL' || log.action_type === selectedActionType;

    return matchesSearch && matchesType;
  });

  const toggleExpandLog = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="main-content">
        <TopHeader title="Log Aktivitas Admin" subtitle="Riwayat audit operasi sistem (hanya-baca, anti-manipulasi)" />

        <div className="page-content fade-in" style={{ padding: '24px var(--gutter)' }}>
          
          {/* Controls Bar */}
          <div className="logs-control-bar glass-panel">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari deskripsi aksi atau email admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-box">
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="action-type-select"
              >
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'Semua Tipe Aksi' : type}
                  </option>
                ))}
              </select>

              <button className="icon-btn refresh-logs-btn" onClick={fetchLogs} title="Refresh Data">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Logs Table Area */}
          {loading ? (
            <div className="logs-loading-card glass-panel">
              <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
              <p>Memuat riwayat aktivitas...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty-card glass-panel">
              <Database size={48} className="empty-icon" />
              <h4>Tidak ada log aktivitas ditemukan</h4>
              <p>Belum ada data audit log yang sesuai dengan filter pencarian saat ini.</p>
            </div>
          ) : (
            <div className="logs-table-container glass-panel">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Email Admin</th>
                    <th>Tipe Aksi</th>
                    <th>Deskripsi</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const isExpanded = expandedLogId === log.id;
                    const dateObj = new Date(log.created_at);
                    
                    return (
                      <React.Fragment key={log.id}>
                        <tr className={isExpanded ? 'active-row' : ''}>
                          <td className="log-time-cell">
                            <span className="log-date">
                              {dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="log-hour">
                              {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </td>
                          <td className="log-email-cell">
                            <span className="admin-email-tag">{log.admin_email || 'System'}</span>
                          </td>
                          <td>
                            <span className={`log-badge-node ${getActionBadgeClass(log.action_type)}`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="log-desc-cell">
                            {log.description}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {log.details ? (
                              <button 
                                className="expand-details-btn" 
                                onClick={() => toggleExpandLog(log.id)}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            ) : (
                              <span className="no-details-dash">—</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && log.details && (
                          <tr className="details-expanded-row">
                            <td colSpan={5}>
                              <div className="details-expanded-container">
                                <div className="details-title">
                                  <ShieldAlert size={14} /> Data Perubahan (JSON Payload):
                                </div>
                                <pre className="details-raw-json">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
