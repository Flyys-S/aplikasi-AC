import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, ChevronRight, Loader2, Headphones,
  Sun, Moon, Plus, X, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, FileText, Send, ArrowLeft, Menu, Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatTanggalJam } from '../../lib/formatters';
import toast from 'react-hot-toast';
import Navigation from '../../components/Navigation';
import './VisitorDashboard.css';

/* ─── Helpers ─── */
const getServiceStatusLabel = (s) => ({
  pending:     'Menunggu Teknisi',
  in_progress: 'Sedang Dikerjakan',
  completed:   'Selesai',
  cancelled:   'Dibatalkan',
}[s] || 'Menunggu');

const getServiceStatusClass = (s) => ({
  pending:     'service-status-pending',
  in_progress: 'service-status-progress',
  completed:   'service-status-done',
  cancelled:   'service-status-cancel',
}[s] || 'service-status-pending');

const SERVICE_TYPES = [
  'Cuci AC Rutin',
  'Isi / Tambah Freon',
  'Troubleshoot',
  'Pengecekan Umum',
  'Pasang AC Baru',
  'Bongkar AC',
  'Perbaikan Kebocoran Pipa',
];

const WA_NUMBER = '6281234567890';

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const VisitorDashboard = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* ── State ── */
  const [serviceReqs, setServiceReqs] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editing/Rescheduling State
  const [editingJobId, setEditingJobId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTomorrowDate());

  /* ── Form state ── */
  const [serviceForm, setServiceForm] = useState({
    service_type:            'Cuci AC Rutin',
    complaint_description:   '',
    service_address:         '',
    scheduled_date:          getTomorrowDate(),
    contact_phone:           '',
  });

  /* ── Auth guard ── */
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, navigate]);

  /* ── Fetch service requests ── */
  const fetchServiceRequests = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('service_jobs')
        .select('id, service_type, complaint_description, service_address, scheduled_date, status, created_at, notes')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceReqs(data || []);
    } catch (e) {
      console.error('[VisitorDashboard] Fetch service requests:', e.message);
    } finally {
      setLoadingServices(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  /* ── Cancel Service request ── */
  const handleCancelService = async (jobId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan permintaan servis ini?')) return;
    try {
      const { error } = await supabase
        .from('service_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Permintaan servis berhasil dibatalkan');
      fetchServiceRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal membatalkan: ' + e.message);
    }
  };

  /* ── Reschedule Service request ── */
  const handleRescheduleService = async (jobId) => {
    if (!rescheduleDate) {
      toast.error('Mohon pilih tanggal baru');
      return;
    }
    try {
      const { error } = await supabase
        .from('service_jobs')
        .update({ scheduled_date: rescheduleDate })
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Jadwal servis berhasil diatur ulang');
      setEditingJobId(null);
      fetchServiceRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengatur ulang jadwal: ' + e.message);
    }
  };

  /* ── Submit service request ── */
  const handleSubmitService = async (e) => {
    e.preventDefault();
    if (!serviceForm.complaint_description.trim()) {
      toast.error('Mohon jelaskan keluhan Anda.');
      return;
    }
    if (!serviceForm.service_address.trim()) {
      toast.error('Mohon isi alamat servis.');
      return;
    }
    if (!serviceForm.scheduled_date) {
      toast.error('Mohon pilih tanggal servis.');
      return;
    }

    try {
      setSubmitting(true);

      const { data: custData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const insertPayload = {
        service_type:          serviceForm.service_type,
        complaint_description: serviceForm.complaint_description.trim(),
        service_address:       serviceForm.service_address.trim(),
        scheduled_date:        serviceForm.scheduled_date,
        notes:                 serviceForm.contact_phone
                                 ? `Kontak: ${serviceForm.contact_phone}`
                                 : null,
        status:                'pending',
        technician_id:         null,
        created_by:            user.id,
        ...(custData?.id ? { customer_id: custData.id } : {}),
      };

      const { error } = await supabase
        .from('service_jobs')
        .insert([insertPayload]);

      if (error) throw error;

      toast.success('✅ Permintaan servis berhasil diajukan!');
      setServiceForm({
        service_type:          'Cuci AC Rutin',
        complaint_description: '',
        service_address:       '',
        scheduled_date:        getTomorrowDate(),
        contact_phone:         '',
      });
      fetchServiceRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengajukan servis: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const userName = user?.email?.split('@')[0] || 'Pelanggan';
  const waMessage = encodeURIComponent('Halo Mitra Maju Sejati, saya ingin bertanya tentang servis AC...');
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  return (
    <>
      <div className="dashboard-container customer-layout">
        
        {/* ─── Header ─── */}
        <header className="top-header glass-panel">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
              <button 
                className="icon-btn back-btn-customer" 
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                className="icon-btn hamburger-btn-customer" 
                onClick={() => document.body.classList.toggle('sidebar-open')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: 'var(--color-on-surface)'
                }}
                title="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
            <div className="header-info">
              <h2>Layanan Servis</h2>
              <p>Atur jadwal pemeliharaan AC Anda</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* ─── Page Content ─── */}
        <div className="page-content fade-in" style={{ padding: '24px var(--gutter)' }}>
          <div className="visitor-service-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
            
            {/* ─── FORM SCHEDULING (Left Column) ─── */}
            <div className="tool-card glass-panel" style={{ padding: '28px', height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={22} color="var(--color-primary)" /> Ajukan Servis AC Baru
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
                Paling cepat adalah H-1 (Esok Hari). Admin kami akan menunjuk teknisi terbaik setelah verifikasi slot.
              </p>

              <form onSubmit={handleSubmitService} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Jenis Layanan */}
                <div className="vd-form-group">
                  <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>Jenis Layanan</label>
                  <select
                    className="vd-form-select"
                    value={serviceForm.service_type}
                    onChange={e => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                  >
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Deskripsi Keluhan */}
                <div className="vd-form-group">
                  <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                    Deskripsi Masalah / Keluhan <span className="vd-form-required" style={{ color: '#ff4444' }}>*</span>
                  </label>
                  <textarea
                    className="vd-form-textarea"
                    placeholder="Tulis keluhan Anda (misal: AC bocor air, outdoor berisik, AC kurang dingin setelah dicuci...)"
                    rows={4}
                    value={serviceForm.complaint_description}
                    onChange={e => setServiceForm({ ...serviceForm, complaint_description: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)', resize: 'vertical' }}
                  />
                </div>

                {/* Alamat Servis */}
                <div className="vd-form-group">
                  <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                    Alamat Lengkap Servis <span className="vd-form-required" style={{ color: '#ff4444' }}>*</span>
                  </label>
                  <textarea
                    className="vd-form-textarea"
                    placeholder="Masukkan alamat lengkap lokasi pengerjaan..."
                    rows={3}
                    value={serviceForm.service_address}
                    onChange={e => setServiceForm({ ...serviceForm, service_address: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)', resize: 'vertical' }}
                  />
                </div>

                {/* Tanggal Penjadwalan */}
                <div className="vd-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', margin: 0 }}>Tanggal Servis</label>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(0, 85, 255, 0.08)', padding: '2px 8px', borderRadius: '8px' }}>
                      Slot Tersedia: 3/5 harian
                    </span>
                  </div>
                  <input
                    type="date"
                    className="vd-form-input"
                    min={getTomorrowDate()}
                    value={serviceForm.scheduled_date}
                    onChange={e => setServiceForm({ ...serviceForm, scheduled_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                  />
                </div>

                {/* Kontak */}
                <div className="vd-form-group">
                  <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>Nomor HP Kontak</label>
                  <input
                    type="tel"
                    className="vd-form-input"
                    placeholder="0812xxxxxxxx"
                    value={serviceForm.contact_phone}
                    onChange={e => setServiceForm({ ...serviceForm, contact_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="vd-submit-btn"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(0, 85, 255, 0.25)',
                    marginTop: '8px'
                  }}
                >
                  {submitting ? (
                    <><Loader2 size={18} className="vd-spinner" /> Memproses...</>
                  ) : (
                    <><Send size={18} /> Ajukan Jadwal Servis</>
                  )}
                </button>

              </form>
            </div>

            {/* ─── MY SERVICES LIST (Right Column) ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="vd-section-header" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="vd-section-title" style={{ fontSize: '18px', fontWeight: '800' }}>🔧 Servis AC Saya</h3>
                <span className="vd-see-all-btn" style={{ fontSize: '12px', opacity: 0.8 }}>({serviceReqs.length} total)</span>
              </div>

              {loadingServices ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <Loader2 size={32} className="vd-spinner" color="var(--color-primary)" />
                </div>
              ) : serviceReqs.length === 0 ? (
                <div className="vd-empty" style={{ background: 'var(--color-surface-container-low)', padding: '40px 24px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--color-outline-variant)' }}>
                  <div className="vd-empty-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
                  <h4 style={{ margin: 0, fontWeight: '700' }}>Belum Ada Pengajuan</h4>
                  <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Daftar jadwal servis Anda akan tampil di kolom ini.</p>
                </div>
              ) : (
                <div className="vd-service-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
                  {serviceReqs.map(req => (
                    <div key={req.id} className="vd-service-card card-elevation" style={{ background: 'var(--color-surface-container-low)', borderRadius: '18px', padding: '20px', border: '1px solid var(--color-outline-variant)', position: 'relative' }}>
                      <div className="vd-service-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div className="vd-service-type-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>
                          <Wrench size={14} />
                          {req.service_type}
                        </div>
                        <span className={`vd-service-status ${getServiceStatusClass(req.status)}`} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {req.status === 'completed'   && <CheckCircle size={11} />}
                          {req.status === 'pending'      && <Clock size={11} />}
                          {req.status === 'in_progress' && <AlertCircle size={11} />}
                          {getServiceStatusLabel(req.status)}
                        </span>
                      </div>

                      {req.complaint_description && (
                        <p style={{ fontSize: '13px', color: 'var(--color-on-surface)', margin: '0 0 12px 0', lineHeight: 1.4, background: 'var(--color-surface-container-lowest)', padding: '10px 12px', borderRadius: '10px' }}>
                          <strong>Keluhan:</strong> {req.complaint_description}
                        </p>
                      )}

                      <div className="vd-service-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--color-on-surface-variant)', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                          <span>Tanggal Jadwal: <strong>{new Date(req.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                        </div>
                        {req.service_address && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <MapPin size={13} style={{ color: 'var(--color-primary)', marginTop: '2px' }} />
                            <span>{req.service_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Cancel & Reschedule Actions */}
                      {(req.status === 'pending' || req.status === 'in_progress') && (
                        <div style={{ marginTop: '8px' }}>
                          {editingJobId === req.id ? (
                            <div className="reschedule-form" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-surface-container-high)', padding: '10px', borderRadius: '12px' }}>
                              <input 
                                type="date" 
                                className="vd-form-input" 
                                min={getTomorrowDate()}
                                value={rescheduleDate}
                                onChange={e => setRescheduleDate(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)', fontSize: '12px' }}
                              />
                              <button 
                                className="vd-submit-btn" 
                                style={{ padding: '6px 12px', width: 'auto', margin: 0, fontSize: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => handleRescheduleService(req.id)}
                              >
                                Simpan
                              </button>
                              <button 
                                className="qty-btn" 
                                style={{ border: '1px solid var(--color-outline-variant)', background: 'transparent', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--color-on-surface)' }}
                                onClick={() => setEditingJobId(null)}
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="vd-see-all-btn" 
                                style={{ background: 'rgba(0, 85, 255, 0.08)', color: 'var(--color-primary)', border: 'none', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '800' }}
                                onClick={() => { setEditingJobId(req.id); setRescheduleDate(req.scheduled_date); }}
                              >
                                Reschedule
                              </button>
                              <button 
                                className="vd-see-all-btn" 
                                style={{ background: 'rgba(255, 68, 68, 0.08)', color: '#ff4444', border: 'none', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '800' }}
                                onClick={() => handleCancelService(req.id)}
                              >
                                Batalkan
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

              {/* WA Help Button */}
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="vd-wa-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', marginTop: '8px' }}>
                <Headphones size={18} />
                Butuh Bantuan? Hubungi via WhatsApp
              </a>

            </div>

          </div>
        </div>

      </div>
      <Navigation />
    </>
  );
};

export default VisitorDashboard;
