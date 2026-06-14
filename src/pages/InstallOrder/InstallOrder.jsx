import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, ChevronRight, Loader2,
  Sun, Moon, Plus, X, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, FileText, Send, ArrowLeft, Menu, MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import Navigation from '../../components/Navigation';
import './InstallOrder.css';

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

const INSTALL_TYPES = [
  'Pasang AC Baru',
  'Bongkar AC',
  'Bongkar Pasang',
];

const WA_NUMBER = '6281234567890';

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const InstallOrder = () => {
  const navigate = useNavigate();
  const { user, isBioComplete, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* ── State ── */
  const [installReqs, setInstallReqs] = useState([]);
  const [loadingInstalls, setLoadingInstalls] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editing/Rescheduling State
  const [editingJobId, setEditingJobId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTomorrowDate());

  /* ── Form state ── */
  const [installForm, setInstallForm] = useState({
    service_type:            'Pasang AC Baru',
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

  /* ── Fetch installation requests ── */
  const fetchInstallRequests = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingInstalls(true);
      const { data, error } = await supabase
        .from('service_jobs')
        .select('id, service_type, complaint_description, service_address, scheduled_date, status, created_at, notes')
        .eq('created_by', user.id)
        .in('service_type', INSTALL_TYPES)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstallReqs(data || []);
    } catch (e) {
      console.error('[InstallOrder] Fetch install requests:', e.message);
    } finally {
      setLoadingInstalls(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstallRequests();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInstallRequests]);

  /* ── Cancel request ── */
  const handleCancelInstall = async (jobId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan permintaan ini?')) return;
    try {
      const { error } = await supabase
        .from('service_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Permintaan berhasil dibatalkan');
      fetchInstallRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal membatalkan: ' + e.message);
    }
  };

  /* ── Reschedule request ── */
  const handleRescheduleInstall = async (jobId) => {
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
      toast.success('Jadwal pemasangan berhasil diatur ulang');
      setEditingJobId(null);
      fetchInstallRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengatur ulang jadwal: ' + e.message);
    }
  };

  /* ── Submit request ── */
  const handleSubmitInstall = async (e) => {
    e.preventDefault();
    if (!installForm.complaint_description.trim()) {
      toast.error('Mohon isi deskripsi pekerjaan.');
      return;
    }
    if (!installForm.service_address.trim()) {
      toast.error('Mohon isi alamat lengkap.');
      return;
    }
    if (!installForm.scheduled_date) {
      toast.error('Mohon pilih tanggal pengerjaan.');
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
        service_type:          installForm.service_type,
        complaint_description: installForm.complaint_description.trim(),
        service_address:       installForm.service_address.trim(),
        scheduled_date:        installForm.scheduled_date,
        notes:                 installForm.contact_phone
                                 ? `Kontak: ${installForm.contact_phone}`
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

      toast.success('✅ Permintaan pemasangan berhasil diajukan!');
      setInstallForm({
        service_type:          'Pasang AC Baru',
        complaint_description: '',
        service_address:       '',
        scheduled_date:        getTomorrowDate(),
        contact_phone:         '',
      });
      fetchInstallRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengajukan pemasangan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const waMessage = encodeURIComponent('Halo Mitra Maju Sejati, saya ingin bertanya tentang jasa bongkar/pasang AC...');
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  if (authLoading) {
    return (
      <div className="dashboard-container customer-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Loader2 className="vd-spinner animate-spin" size={40} color="var(--color-primary)" />
      </div>
    );
  }

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
              <h2>Jasa Pasang AC</h2>
              <p>Atur jadwal bongkar pasang & instalasi AC</p>
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
                Untuk melakukan pemesanan jasa pasang AC, Anda wajib melengkapi data profil terlebih dahulu (Nama Lengkap, Nomor Telepon, dan Alamat Lengkap).
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
                  <Wrench size={22} color="var(--color-primary)" /> Ajukan Pasang / Bongkar AC
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
                  Instalasi AC baru atau relokasi AC lama. Admin kami akan menghubungi untuk koordinasi teknis.
                </p>

                <form onSubmit={handleSubmitInstall} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* Jenis Layanan */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Pilih Layanan Instalasi</label>
                    <div className="service-card-grid">
                      {[
                        { type: 'Pasang AC Baru', icon: '❄️', desc: 'Pasang Unit Baru' },
                        { type: 'Bongkar AC', icon: '🛠️', desc: 'Pelepasan Unit AC' },
                        { type: 'Bongkar Pasang', icon: '🔄', desc: 'Pemindahan / Relokasi' }
                      ].map(item => (
                        <div
                          key={item.type}
                          className={`service-select-card ${installForm.service_type === item.type ? 'selected' : ''}`}
                          onClick={() => setInstallForm({ ...installForm, service_type: item.type })}
                        >
                          <span className="service-select-card-icon">{item.icon}</span>
                          <span className="service-select-card-title">{item.type}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', opacity: 0.8 }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi Pekerjaan */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                      Deskripsi Pekerjaan / Catatan Spesifikasi <span className="vd-form-required">*</span>
                    </label>
                    <textarea
                      className="vd-form-textarea"
                      placeholder="Jelaskan spesifikasi AC (misal: AC Daikin 1 PK, butuh pipa 5 meter, pasang di lantai 2...)"
                      rows={4}
                      value={installForm.complaint_description}
                      onChange={e => setInstallForm({ ...installForm, complaint_description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Alamat Pemasangan */}
                  <div className="vd-form-group">
                    <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px' }}>
                      Alamat Lengkap Lokasi <span className="vd-form-required">*</span>
                    </label>
                    <textarea
                      className="vd-form-textarea"
                      placeholder="Masukkan alamat lengkap lokasi pengerjaan..."
                      rows={3}
                      value={installForm.service_address}
                      onChange={e => setInstallForm({ ...installForm, service_address: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tanggal & Kontak */}
                  <div className="form-row-horizontal">
                    {/* Tanggal */}
                    <div className="vd-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="vd-form-label" style={{ fontWeight: '700', fontSize: '13px', margin: 0 }}>Tanggal Pengerjaan</label>
                      </div>
                      <input
                        type="date"
                        className="vd-form-input"
                        min={getTomorrowDate()}
                        value={installForm.scheduled_date}
                        onChange={e => setInstallForm({ ...installForm, scheduled_date: e.target.value })}
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
                        value={installForm.contact_phone}
                        onChange={e => setInstallForm({ ...installForm, contact_phone: e.target.value })}
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
                      <><Send size={18} /> Ajukan Jadwal Pemasangan</>
                    )}
                  </button>

                </form>
              </div>

              {/* ─── MY INSTALLATIONS LIST (Right Column) ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {loadingInstalls ? (
                  <div className="tool-card glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', minHeight: '300px' }}>
                    <Loader2 size={32} className="vd-spinner" color="var(--color-primary)" />
                  </div>
                ) : installReqs.length === 0 ? (
                  <div className="tool-card glass-panel" style={{ padding: '28px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,85,255,0.15))' }}>❄️🔧</div>
                    <h4 style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '16px' }}>Belum Ada Jadwal Pasang AC</h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', maxWidth: '280px', margin: 0, lineHeight: 1.5 }}>
                      Ingin memasang AC baru atau merelokasi AC? Yuk ajukan jadwal pemasangan di kolom kiri sekarang!
                    </p>
                  </div>
                ) : (
                  <div className="tool-card glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px' }}>Riwayat Pemasangan AC</h4>
                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(0, 85, 255, 0.08)', padding: '2px 8px', borderRadius: '8px' }}>
                        {installReqs.length} Pengerjaan
                      </span>
                    </div>

                    <div className="vd-service-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                      {installReqs.map(req => (
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
                                    <button onClick={() => handleRescheduleInstall(req.id)} style={{ padding: '2px 6px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>Set</button>
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
                                      onClick={() => handleCancelInstall(req.id)}
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

export default InstallOrder;
