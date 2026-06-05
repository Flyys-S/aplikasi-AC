import React, { useState, useEffect, useCallback } from 'react';
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
  const [action, setAction] = useState('');
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
const JobCard = ({ job, onOpenDetail, onQuickUpdateStatus }) => {
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
              onClick={(e) => { e.stopPropagation(); onOpenDetail(job); }}
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
  }, [user?.id]);

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

  /* ─── Filtered Jobs ─── */
  const filteredJobs = jobs.filter(j => {
    if (activeFilter === 'active') return j.status === 'pending' || j.status === 'in_progress';
    return j.status === activeFilter;
  });

  /* ─── Greeting ─── */
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const greetIcon = hour < 11 ? '☀️' : hour < 15 ? '🌤️' : hour < 18 ? '🌅' : '🌙';
  const userName = user?.email?.split('@')[0] || 'Teknisi';

  return (
    <div className="dashboard-container">
      <TopHeader title="Dashboard Teknisi" subtitle="Daftar tugas servis Anda" />

      <div className="page-content fade-in">

        {/* ─── Hero Greeting ─── */}
        <div className="tech-hero">
          <div className="tech-hero-text">
            <p className="tech-hero-greeting">{greetIcon} {greeting},</p>
            <h2 className="tech-hero-name">{userName}</h2>
            <p className="tech-hero-sub">
              {stats.in_progress > 0
                ? `Anda sedang mengerjakan ${stats.in_progress} tugas aktif`
                : stats.pending > 0
                ? `${stats.pending} tugas menunggu untuk dikerjakan`
                : 'Semua tugas hari ini sudah selesai! 🎉'}
            </p>
          </div>
          <div className="tech-hero-icon">
            <Wrench size={28} />
          </div>
        </div>

        {/* ─── Stats Cards ─── */}
        <div className="tech-stats-row">
          <div className="tech-stat-card">
            <div className="tech-stat-icon pending">
              <Clock size={18} />
            </div>
            <span className="tech-stat-value">{stats.pending}</span>
            <span className="tech-stat-label">Menunggu</span>
          </div>
          <div className="tech-stat-card">
            <div className="tech-stat-icon progress">
              <Activity size={18} />
            </div>
            <span className="tech-stat-value">{stats.in_progress}</span>
            <span className="tech-stat-label">Dikerjakan</span>
          </div>
          <div className="tech-stat-card">
            <div className="tech-stat-icon done">
              <CheckCircle2 size={18} />
            </div>
            <span className="tech-stat-value">{stats.completed}</span>
            <span className="tech-stat-label">Selesai</span>
          </div>
        </div>

        {/* ─── Filter Tabs ─── */}
        <div className="filter-tabs">
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

        {/* ─── Job List ─── */}
        <div className="section-header">
          <h3 className="section-title">
            {FILTERS.find(f => f.key === activeFilter)?.label.replace(/[^a-zA-Z\s]/g, '').trim()}
          </h3>
          <span className="section-count">{filteredJobs.length} tugas</span>
        </div>

        {loading ? (
          <div className="tech-empty-state">
            <div className="tech-empty-icon">
              <Loader2 size={32} className="spin-loader" />
            </div>
            <p className="tech-empty-desc">Memuat daftar tugas...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="tech-empty-state">
            <div className="tech-empty-icon">
              {activeFilter === 'completed' ? <CheckCircle2 size={32} /> : <Coffee size={32} />}
            </div>
            <h4 className="tech-empty-title">
              {activeFilter === 'completed' ? 'Belum ada tugas selesai' : 'Tidak ada tugas'}
            </h4>
            <p className="tech-empty-desc">
              {activeFilter === 'active'
                ? 'Tidak ada tugas aktif saat ini. Nikmati istirahat Anda! ☕'
                : activeFilter === 'completed'
                ? 'Tugas yang sudah selesai akan muncul di sini.'
                : 'Tidak ada tugas dengan filter ini.'}
            </p>
          </div>
        ) : (
          <div className="job-list">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onOpenDetail={setSelectedJob}
                onQuickUpdateStatus={handleQuickUpdateStatus}
              />
            ))}
          </div>
        )}
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
