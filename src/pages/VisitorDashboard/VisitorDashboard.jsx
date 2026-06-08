import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, ChevronRight, Loader2, Headphones,
  Sun, Moon, Plus, X, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, FileText, Send, ArrowLeft, Menu, Phone, MessageCircle
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
  const { user, role, isBioComplete } = useAuth();
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
          {!isBioComplete ? (
            <div className="tool-card glass-panel" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontSize: '72px', filter: 'drop-shadow(0 4px 12px rgba(0,85,255,0.15))' }}>🔒👤</div>
              <h3 style={{ margin: 0, fontWeight: '800', fontSize: '20px' }}>Biodata Belum Lengkap</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                Untuk melakukan pemesanan jasa servis AC, Anda wajib melengkapi data profil terlebih dahulu (Nama Lengkap, Nomor Telepon, dan Alamat Lengkap).
              </p>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 85, 255, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                Lengkapi Biodata Sekarang
              </button>
            </div>
          ) : (
            <div className="visitor-service-layout">
              
              {/* ─── FORM SCHEDULING (Left Column) ─── */}
              <div className="tool-card glass-panel" style={{ padding: '28px', height: 'fit-content' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={22} color="var(--color-primary)" /> Ajukan Servis AC Baru
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
                  Paling cepat adalah H-1 (Esok Hari). Admin kami akan menunjuk teknisi terbaik setelah verifikasi slot.
                </p>

                <form onSubmit={handleSubmitService} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* Jenis Layanan (Selectable Cards Grid) */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Pilih Jenis Layanan</label>
                    <div className="service-card-grid">
                      {[
                        { type: 'Cuci AC Rutin', icon: '🧼', desc: 'Perawatan Berkala' },
                        { type: 'Perbaikan AC', icon: '🔧', desc: 'Troubleshoot & Servis' },
                        { type: 'Bongkar Pasang', icon: '🛠️', desc: 'Relokasi / Pasang Baru' }
                      ].map(item => (
                        <div
                          key={item.type}
                          className={`service-select-card ${serviceForm.service_type === item.type ? 'selected' : ''}`}
                          onClick={() => setServiceForm({ ...serviceForm, service_type: item.type })}
                        >
                          <span className="service-select-card-icon">{item.icon}</span>
                          <span className="service-select-card-title">{item.type}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', opacity: 0.8 }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi Keluhan */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                      Deskripsi Masalah / Keluhan <span className="vd-form-required">*</span>
                    </label>
                    <textarea
                      className="vd-form-textarea"
                      placeholder="Tulis keluhan Anda secara detail (misal: AC bocor air, outdoor berisik, AC kurang dingin...)"
                      rows={4}
                      value={serviceForm.complaint_description}
                      onChange={e => setServiceForm({ ...serviceForm, complaint_description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Alamat Servis */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                      Alamat Lengkap Servis <span className="vd-form-required">*</span>
                    </label>
                    <textarea
                      className="vd-form-textarea"
                      placeholder="Masukkan alamat lengkap lokasi pengerjaan..."
                      rows={3}
                      value={serviceForm.service_address}
                      onChange={e => setServiceForm({ ...serviceForm, service_address: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tanggal & Kontak (Inline Grid) */}
                  <div className="form-row-horizontal">
                    {/* Tanggal Penjadwalan */}
                    <div className="vd-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', margin: 0 }}>Tanggal Servis</label>
                        <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(0, 85, 255, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
                          Slot: 3/5
                        </span>
                      </div>
                      <input
                        type="date"
                        className="vd-form-input"
                        min={getTomorrowDate()}
                        value={serviceForm.scheduled_date}
                        onChange={e => setServiceForm({ ...serviceForm, scheduled_date: e.target.value })}
                        required
                      />
                    </div>

                    {/* Kontak */}
                    <div className="vd-form-group">
                      <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Nomor HP Kontak</label>
                      <input
                        type="tel"
                        className="vd-form-input"
                        placeholder="0812xxxxxxxx"
                        value={serviceForm.contact_phone}
                        onChange={e => setServiceForm({ ...serviceForm, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="vd-submit-btn-new"
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
                {loadingServices ? (
                  <div className="tool-card glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', minHeight: '300px' }}>
                    <Loader2 size={32} className="vd-spinner" color="var(--color-primary)" />
                  </div>
                ) : serviceReqs.length === 0 ? (
                  <div className="tool-card glass-panel" style={{ padding: '28px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,85,255,0.15))' }}>❄️🤖</div>
                    <h4 style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '16px' }}>Wah, Belum Ada Jadwal Servis!</h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', maxWidth: '280px', margin: 0, lineHeight: 1.5 }}>
                      AC Anda butuh dicuci atau diperbaiki? Yuk ajukan jadwal servis di kolom kiri. Teknisi andalan kami siap meluncur!
                    </p>
                  </div>
                ) : (
                  <div className="tool-card glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px' }}>Riwayat & Status Servis</h4>
                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(0, 85, 255, 0.08)', padding: '2px 8px', borderRadius: '8px' }}>
                        {serviceReqs.length} Pengerjaan
                      </span>
                    </div>

                    <div className="vd-service-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                      {serviceReqs.map(req => (
                        <div key={req.id} style={{ background: 'var(--color-surface-container-low)', borderRadius: '16px', padding: '16px', border: '1px solid var(--color-outline-variant)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--color-on-surface)' }}>
                              {req.service_type}
                            </span>
                            <span className={`vd-service-status ${getServiceStatusClass(req.status)}`} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                              {getServiceStatusLabel(req.status)}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '0 0 10px 0', background: 'var(--color-surface-container-lowest)', padding: '8px 10px', borderRadius: '8px', lineHeight: 1.4 }}>
                            {req.complaint_description}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-outline)', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '10px' }}>
                            <span>📅 {new Date(req.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            
                            {/* Cancel/Reschedule trigger inside list item */}
                            {(req.status === 'pending' || req.status === 'in_progress') && (
                              <div>
                                {editingJobId === req.id ? (
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    <input 
                                      type="date" 
                                      min={getTomorrowDate()}
                                      value={rescheduleDate}
                                      onChange={e => setRescheduleDate(e.target.value)}
                                      style={{ padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--color-outline-variant)', fontSize: '10px', background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                                    />
                                    <button onClick={() => handleRescheduleService(req.id)} style={{ padding: '2px 6px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>Set</button>
                                    <button onClick={() => setEditingJobId(null)} style={{ padding: '2px 6px', border: '1px solid var(--color-outline-variant)', background: 'transparent', color: 'var(--color-on-surface)', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>X</button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                      onClick={() => { setEditingJobId(req.id); setRescheduleDate(req.scheduled_date); }}
                                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                    >
                                      Ubah
                                    </button>
                                    <button 
                                      onClick={() => handleCancelService(req.id)}
                                      style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                    >
                                      Batal
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Floating Action Button (FAB) WhatsApp */}
      <a 
        href={waUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-fab"
        title="Hubungi Kami via WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      <Navigation />
    </>
  );
};

export default VisitorDashboard;
