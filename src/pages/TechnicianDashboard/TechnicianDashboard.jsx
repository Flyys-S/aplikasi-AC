import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, MapPin, Phone, User, Clock, Calendar,
  CheckCircle2, PlayCircle, ChevronRight, X,
  FileText, AlertTriangle, ClipboardList, Navigation2,
  Loader2, Star, Activity, Coffee
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import toast from 'react-hot-toast';
import './TechnicianDashboard.css';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getStatusLabel = (s) => ({
  pending: 'Menunggu',
  in_progress: 'Dikerjakan',
  completed: 'Selesai',
}[s] || s);

const getServiceTypeLabel = (t) => ({
  installation: 'Pasang AC Baru',
  maintenance: 'Perawatan Rutin',
  repair: 'Perbaikan',
  cleaning: 'Cuci AC',
}[t] || t);

const getPriorityLabel = (p) => ({ 3: 'Urgent', 2: 'Normal', 1: 'Rendah' }[p] || 'Normal');
const getPriorityClass = (p) => ({ 3: 'high', 2: 'medium', 1: 'low' }[p] || 'medium');
const getPriorityCardClass = (p) => ({ 3: 'priority-high', 2: 'priority-medium', 1: 'priority-low' }[p] || 'priority-medium');

const FILTERS = [
  { key: 'active', label: '🔥 Aktif' },
  { key: 'pending', label: '⏳ Menunggu' },
  { key: 'in_progress', label: '🔧 Dikerjakan' },
  { key: 'completed', label: '✅ Selesai' },
];

/* ─────────────────────────────────────────
   Sub-component: Job Detail Bottom Sheet
───────────────────────────────────────── */
const JobDetailSheet = ({ job, onClose, onUpdateStatus }) => {
  const [technicianAction, setTechnicianAction] = useState(job?.technician_action || '');
  const [technicianNotes, setTechnicianNotes] = useState(job?.technician_notes || '');
  const [saving, setSaving] = useState(false);

  if (!job) return null;

  const customer = job.customers;
  const customerPhone = customer?.phone;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.service_address || '')}`;

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'completed' && !technicianAction.trim()) {
      toast.error('Mohon isi tindakan yang dilakukan sebelum menyelesaikan tugas.');
      return;
    }

    const confirmed = window.confirm(
      newStatus === 'completed'
        ? 'Tandai tugas ini sebagai SELESAI? Pastikan laporan sudah diisi.'
        : 'Mulai mengerjakan tugas ini sekarang?'
    );
    if (!confirmed) return;

    try {
      setSaving(true);

      const updatePayload = {
        status: newStatus,
        technician_action: technicianAction,
        technician_notes: technicianNotes,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'in_progress') updatePayload.started_at = new Date().toISOString();
      if (newStatus === 'completed') updatePayload.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('service_jobs')
        .update(updatePayload)
        .eq('id', job.id);

      if (error) throw error;

      toast.success(
        newStatus === 'completed' ? '🎉 Tugas berhasil diselesaikan!' : '▶️ Tugas dimulai!'
      );
      onUpdateStatus();
      onClose();
    } catch (err) {
      toast.error('Gagal update status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <h3>Detail Tugas</h3>
          <button className="sheet-close-btn" onClick={onClose} id="btn-close-sheet">
            <X size={16} />
          </button>
        </div>

        <div className="sheet-body">
          {/* Order Info */}
          <div className="sheet-info-block">
            <div className="sheet-info-block-label">📋 Informasi Order</div>
            <div className="sheet-info-row">
              <FileText size={15} />
              <span><strong>{job.order_number || `#JOB-${job.id}`}</strong> · {getServiceTypeLabel(job.service_type)}</span>
            </div>
            <div className="sheet-info-row">
              <Calendar size={15} />
              <span>{formatDate(job.scheduled_date)} {job.scheduled_time ? `· ${job.scheduled_time.substring(0,5)} WIB` : ''}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="sheet-info-block">
            <div className="sheet-info-block-label">👤 Data Pelanggan</div>
            <div className="sheet-info-row">
              <User size={15} />
              <span>{customer?.name || customer?.full_name || 'Tidak diketahui'}</span>
            </div>
            {customerPhone && (
              <div className="sheet-info-row">
                <Phone size={15} />
                <a href={`tel:${customerPhone}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {customerPhone}
                </a>
              </div>
            )}
            <div className="sheet-info-row">
              <MapPin size={15} />
              <span>{job.service_address || '—'}</span>
            </div>
          </div>

          {/* Complaint */}
          <div className="sheet-info-block">
            <div className="sheet-info-block-label">🔔 Keluhan Customer</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-on-surface)', margin: 0 }}>
              {job.complaint_description || 'Tidak ada keluhan yang tercatat.'}
            </p>
          </div>

          {/* Laporan Form — only for non-completed */}
          {job.status !== 'completed' && (
            <div className="report-form">
              <div className="sheet-info-block" style={{ marginBottom: 12 }}>
                <div className="sheet-info-block-label">📝 Laporan Pengerjaan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <div>
                    <label className="report-label">Tindakan yang Dilakukan *</label>
                    <textarea
                      id="input-technician-action"
                      className="report-textarea"
                      placeholder="Contoh: Mengisi freon R32 sebanyak 500gr, membersihkan filter, mengecek tekanan..."
                      value={technicianAction}
                      onChange={(e) => setTechnicianAction(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="report-label">Catatan Tambahan</label>
                    <textarea
                      id="input-technician-notes"
                      className="report-textarea"
                      placeholder="Contoh: Perlu follow-up 1 bulan lagi, kondisi outdoor unit berkarat..."
                      value={technicianNotes}
                      onChange={(e) => setTechnicianNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sheet-action-row">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheet-btn outline"
                  style={{ textDecoration: 'none', flex: 'none', width: 48 }}
                  title="Buka di Google Maps"
                >
                  <Navigation2 size={18} />
                </a>

                {job.status === 'pending' && (
                  <button
                    id="btn-start-job"
                    className="sheet-btn primary"
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={16} className="spin-loader" /> : <PlayCircle size={16} />}
                    Mulai Kerjakan
                  </button>
                )}

                {job.status === 'in_progress' && (
                  <button
                    id="btn-finish-job"
                    className="sheet-btn success"
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={16} className="spin-loader" /> : <CheckCircle2 size={16} />}
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed Summary */}
          {job.status === 'completed' && (
            <div className="sheet-info-block">
              <div className="sheet-info-block-label">✅ Laporan Selesai</div>
              {job.technician_action && (
                <div className="sheet-info-row" style={{ marginBottom: 8 }}>
                  <ClipboardList size={15} />
                  <span>{job.technician_action}</span>
                </div>
              )}
              {job.technician_notes && (
                <div className="sheet-info-row">
                  <FileText size={15} />
                  <span style={{ fontStyle: 'italic' }}>{job.technician_notes}</span>
                </div>
              )}
              {job.completed_at && (
                <div className="sheet-info-row" style={{ marginTop: 8 }}>
                  <Clock size={15} />
                  <span>Selesai: {new Date(job.completed_at).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Sub-component: Job Card
───────────────────────────────────────── */
const JobCard = ({ job, navigate, onOpenDetail, onQuickUpdateStatus }) => {
  const [loading, setLoading] = useState(false);
  const customer = job.customers;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.service_address || '')}`;

  const handleQuickAction = async (e, newStatus) => {
    e.stopPropagation();
    if (loading) return;
    const msg = newStatus === 'in_progress'
      ? 'Mulai mengerjakan tugas ini?'
      : 'Tugas ini sudah selesai?';
    if (!window.confirm(msg)) return;
    setLoading(true);
    await onQuickUpdateStatus(job.id, newStatus, job.technician_action);
    setLoading(false);
  };

  return (
    <div
      className={`job-card ${getPriorityCardClass(job.priority_level)} fade-in`}
      onClick={() => onOpenDetail(job)}
      id={`job-card-${job.id}`}
    >
      {/* Header Row */}
      <div className="job-card-header">
        <div className="job-card-title">
          <p className="job-order-number">{job.order_number || `JOB-${job.id}`}</p>
          <h4 className="job-service-type">{getServiceTypeLabel(job.service_type)}</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className={`job-status-badge ${job.status}`}>
            {job.status === 'pending' && '⏳ '}
            {job.status === 'in_progress' && '🔧 '}
            {job.status === 'completed' && '✅ '}
            {getStatusLabel(job.status)}
          </span>
          <span className={`priority-badge ${getPriorityClass(job.priority_level)}`}>
            {job.priority_level === 3 && '🔴 '}
            {job.priority_level === 2 && '🟡 '}
            {job.priority_level === 1 && '🟢 '}
            {getPriorityLabel(job.priority_level)}
          </span>
        </div>
      </div>

      {/* Customer & Location */}
      <div className="job-info-row">
        <User size={14} />
        <span style={{ fontWeight: 600 }}>{customer?.name || customer?.full_name || 'Pelanggan'}</span>
      </div>
      <div className="job-info-row">
        <MapPin size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {job.service_address || '—'}
        </span>
      </div>
      <div className="job-info-row">
        <Calendar size={14} />
        <span>{formatDate(job.scheduled_date)}{job.scheduled_time ? ` · ${job.scheduled_time.substring(0,5)} WIB` : ''}</span>
      </div>

      {/* Keluhan Preview */}
      {job.complaint_description && (
        <p className="job-complaint">"{job.complaint_description}"</p>
      )}

      {/* Actions */}
      <div className="job-card-actions" onClick={(e) => e.stopPropagation()}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="job-action-btn maps"
          title="Buka Maps"
          id={`btn-maps-${job.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation2 size={16} />
        </a>

        {job.status === 'pending' && (
          <button
            id={`btn-start-${job.id}`}
            className="job-action-btn start"
            onClick={(e) => handleQuickAction(e, 'in_progress')}
            disabled={loading}
          >
            {loading ? <Loader2 size={15} className="spin-loader" /> : <PlayCircle size={15} />}
            Mulai Kerja
          </button>
        )}

        {job.status === 'in_progress' && (
          <>
            <button
              id={`btn-detail-${job.id}`}
              className="job-action-btn detail"
              onClick={(e) => { e.stopPropagation(); navigate(`/technician/report?job_id=${job.id}`); }}
            >
              <FileText size={15} />
              Isi Laporan
            </button>
            <button
              id={`btn-finish-quick-${job.id}`}
              className="job-action-btn finish"
              style={{ flex: 'none', paddingLeft: 12, paddingRight: 12 }}
              onClick={(e) => handleQuickAction(e, 'completed')}
              disabled={loading}
            >
              {loading ? <Loader2 size={15} className="spin-loader" /> : <CheckCircle2 size={15} />}
            </button>
          </>
        )}

        {job.status === 'completed' && (
          <button
            id={`btn-view-${job.id}`}
            className="job-action-btn detail"
            onClick={(e) => { e.stopPropagation(); onOpenDetail(job); }}
          >
            <ChevronRight size={15} />
            Lihat Detail
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Main Component: TechnicianDashboard
───────────────────────────────────────── */
const TechnicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('active');
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_jobs')
        .select(`
          *,
          customers(id, name, phone)
        `)
        .eq('technician_id', user.id)
        .order('priority_level', { ascending: false })
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err.message);
      toast.error('Gagal memuat daftar tugas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('technician-jobs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_jobs',
        filter: `technician_id=eq.${user.id}`,
      }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchJobs]);

  const handleQuickUpdateStatus = async (jobId, newStatus, existingAction) => {
    try {
      const payload = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'in_progress') payload.started_at = new Date().toISOString();
      if (newStatus === 'completed') {
        if (!existingAction?.trim()) {
          toast.error('Harap isi laporan tindakan dulu lewat tombol "Isi Laporan".');
          return;
        }
        payload.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_jobs')
        .update(payload)
        .eq('id', jobId);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? '🎉 Tugas selesai!' : '▶️ Tugas dimulai!');
      fetchJobs();
    } catch (err) {
      toast.error('Gagal update: ' + err.message);
    }
  };

  /* ─── Computed Stats ─── */
  const stats = {
    pending: jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  /* ─── Greeting ─── */
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const greetIcon = hour < 11 ? '☀️' : hour < 15 ? '🌤️' : hour < 18 ? '🌅' : '🌙';
  const userName = user?.email?.split('@')[0] || 'Teknisi';

  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="dashboard-container">
      <TopHeader title="Dashboard Teknisi" subtitle="Datar tugas servis Anda" />

      <div className="page-content fade-in" style={{ paddingBottom: '100px', paddingLeft: '24px', paddingRight: '24px' }}>

        {/* Row 1 (Welcome & Performance - Grid 65:35) */}
        <div className="tech-row-1-grid">
          <div className="tech-welcome-card">
            <div className="tech-welcome-text">
              <p className="tech-welcome-greeting">{greetIcon} {greeting},</p>
              <h2 className="tech-welcome-name">{userName === 'TEKNISI' ? 'Rafly Rajwa' : userName}</h2>
              <p className="tech-welcome-sub">
                {stats.in_progress > 0
                  ? `Anda sedang mengerjakan ${stats.in_progress} tugas aktif`
                  : stats.pending > 0
                  ? `${stats.pending} tugas menunggu untuk dikerjakan`
                  : 'Semua tugas hari ini sudah selesai! 🎉'}
              </p>
            </div>
            <div className="tech-welcome-icon">
              <Wrench size={24} />
            </div>
          </div>
          <div className="tech-performance-card glass-panel">
            <div className="performance-stars">
              <Star size={20} fill="#facc15" stroke="#facc15" />
            </div>
            <div className="performance-content">
              <span className="performance-label">Kepuasan Pelanggan</span>
              <span className="performance-value">4.9 / 5.0</span>
            </div>
          </div>
        </div>

        {/* Row 2 (Task Status - Grid 3 Columns) */}
        <div className="tech-task-status-grid">
          <div className="tech-status-card" onClick={() => setActiveFilter('pending')}>
            <div className="status-header">
              <span className="status-label">Menunggu</span>
              <div className="status-icon-bg amber-soft">
                <Clock size={16} />
              </div>
            </div>
            <span className="status-value">{stats.pending}</span>
          </div>

          <div className="tech-status-card" onClick={() => setActiveFilter('in_progress')}>
            <div className="status-header">
              <span className="status-label">Dikerjakan</span>
              <div className="status-icon-bg blue-soft">
                <Activity size={16} />
              </div>
            </div>
            <span className="status-value">{stats.in_progress}</span>
          </div>

          <div className="tech-status-card" onClick={() => setActiveFilter('completed')}>
            <div className="status-header">
              <span className="status-label">Selesai</span>
              <div className="status-icon-bg green-soft">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <span className="status-value">{stats.completed}</span>
          </div>
        </div>

        {/* Filter Tabs for Tasks view */}
        <div className="filter-tabs" style={{ marginTop: '24px' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`filter-tab-${f.key}`}
              className={`filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Row 3 (Operations Feed - Grid 60:40) */}
        <div className="tech-operations-grid">
          {/* Left Card: Tugas Servis Aktif */}
          <div className="operations-card left-card glass-panel">
            <div className="operations-header">
              <h3>Tugas Servis Aktif</h3>
              <span className="section-count">{activeJobs.length} tugas</span>
            </div>
            <div className="operations-body">
              {loading ? (
                <div className="tech-compact-empty">
                  <Loader2 size={24} className="spin-loader" />
                  <p>Memuat tugas...</p>
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="job-list">
                  {activeJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      navigate={navigate}
                      onOpenDetail={setSelectedJob}
                      onQuickUpdateStatus={handleQuickUpdateStatus}
                    />
                  ))}
                </div>
              ) : (
                <div className="tech-compact-empty">
                  <Coffee size={36} style={{ color: 'var(--color-outline)' }} />
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px' }}>Tidak ada tugas aktif</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Nikmati istirahat Anda! ☕</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Card: Riwayat Kerja Terbaru */}
          <div className="operations-card right-card glass-panel">
            <div className="operations-header">
              <h3>Riwayat Kerja Terbaru</h3>
            </div>
            <div className="operations-body">
              {completedJobs.length > 0 ? (
                <div className="tech-history-list">
                  {completedJobs.slice(0, 5).map(job => (
                    <div 
                      key={job.id} 
                      className="tech-history-item"
                      onClick={() => setSelectedJob(job)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="history-details">
                        <span className="history-client">{job.customers?.name || 'Klien'}</span>
                        <span className="history-type">{getServiceTypeLabel(job.service_type)}</span>
                      </div>
                      <span className="history-time">
                        {job.completed_at ? new Date(job.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Selesai'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tech-compact-empty">
                  <CheckCircle2 size={32} style={{ color: 'var(--color-outline)' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Belum ada riwayat pengerjaan selesai.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ─── Detail Bottom Sheet ─── */}
      {selectedJob && (
        <JobDetailSheet
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={() => {
            fetchJobs();
            setSelectedJob(null);
          }}
        />
      )}

      <Navigation />
    </div>
  );
};

export default TechnicianDashboard;
