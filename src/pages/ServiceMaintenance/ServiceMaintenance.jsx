import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, PenTool, CheckCircle, Clock, User, Plus, Loader2, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { logAdminActivity } from '../../lib/activityLog';
import InlineLoader from '../../components/InlineLoader';
import EmptyState from '../../components/EmptyState';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import '../SalesDashboard/SalesDashboard.css';
import './ServiceMaintenance.css';

const ServiceMaintenance = () => {
  const { user, isAdmin } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [newJob, setNewJob] = useState({
    customer_id: '',
    technician_id: '',
    service_type: 'Cuci AC Rutin',
    scheduled_date: new Date().toISOString().split('T')[0],
    unit_description: '',
    notes: ''
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // ── Fetch Technicians & Customers DULU (dibutuhkan untuk lookup nama) ──
      let techList = [];
      let custList = [];

      if (isAdmin) {
        const { data: techData, error: techError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('role', 'technician');

        console.log('[ServiceMaintenance] Technicians:', techData, techError);
        if (techError) toast.error('Gagal memuat teknisi: ' + techError.message);
        techList = techData || [];
        setTechnicians(techList);

        const { data: custData, error: custError } = await supabase
          .from('customers')
          .select('id, name, phone')
          .order('name');

        console.log('[ServiceMaintenance] Customers:', custData, custError);
        if (custError) toast.error('Gagal memuat pelanggan: ' + custError.message);
        custList = custData || [];
        setCustomers(custList);
      }

      // ── Fetch Jobs — TANPA join ke profiles (tidak ada FK terdaftar) ──
      // Nama pelanggan di-join via customers (FK sudah ada)
      // Nama teknisi di-resolve manual dari techList di bawah
      let jobsQuery = supabase
        .from('service_jobs')
        .select(`
          *,
          customers(name, phone)
        `)
        .order('scheduled_date', { ascending: false });

      if (!isAdmin) {
        jobsQuery = jobsQuery.eq('technician_id', user?.id);
      }

      const { data: jobsData, error: jobsError } = await jobsQuery;
      if (jobsError) throw jobsError;

      // Enrich setiap job dengan nama teknisi dari techList & nama visitor dari profiles
      const createdByIds = [...new Set((jobsData || []).map(j => j.created_by).filter(Boolean))];
      let profilesMap = {};
      
      if (createdByIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', createdByIds);
        
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      const enrichedJobs = (jobsData || []).map(job => ({
        ...job,
        _technicianName: techList.find(t => t.id === job.technician_id)?.full_name
          || techList.find(t => t.id === job.technician_id)?.email
          || null,
        _creatorName: profilesMap[job.created_by]?.full_name
          || profilesMap[job.created_by]?.email
          || null
      }));

      setJobs(enrichedJobs);
    } catch (error) {
      console.error('Error fetching service data:', error.message);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchInitialData]);

  const handleCreateJob = async () => {
    if (!newJob.customer_id || !newJob.technician_id) {
      toast.error('Mohon pilih pelanggan dan teknisi.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('service_jobs')
        .insert([newJob]);

      if (error) throw error;
      
      const customer = customers.find(c => c.id === newJob.customer_id);
      const technician = technicians.find(t => t.id === newJob.technician_id);
      await logAdminActivity('CREATE_SERVICE_JOB', `Admin membuat tugas ${newJob.service_type} untuk pelanggan ${customer?.name || newJob.customer_id} ditugaskan ke ${technician?.full_name || technician?.email || newJob.technician_id}`, { newJob, customer, technician });

      toast.success('Penugasan teknisi berhasil dibuat!');
      fetchInitialData();
      // Reset form
      setNewJob({
        ...newJob,
        customer_id: '',
        unit_description: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Gagal membuat penugasan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (jobId, newStatus) => {
    try {
      const { error } = await supabase
        .from('service_jobs')
        .update({ status: newStatus })
        .eq('id', jobId);
      
      if (error) throw error;
      
      if (isAdmin) {
        const jobObj = jobs.find(j => j.id === jobId);
        await logAdminActivity('UPDATE_SERVICE_STATUS', `Admin mengubah status tugas ${jobObj?.service_type || jobId} menjadi ${newStatus.toUpperCase()}`, { jobId, newStatus });
      }

      fetchInitialData();
      toast.success('Status berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal update status: ' + error.message);
    }
  };

  const handleAssignTechnician = async (jobId, techId) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('service_jobs')
        .update({ technician_id: techId || null })
        .eq('id', jobId);
      
      if (error) throw error;

      const jobObj = jobs.find(j => j.id === jobId);
      const technician = technicians.find(t => t.id === techId);
      const actionDesc = techId 
        ? `Admin menugaskan teknisi ${technician?.full_name || technician?.email || techId} untuk tugas ${jobObj?.service_type || jobId}`
        : `Admin mencabut penugasan teknisi untuk tugas ${jobObj?.service_type || jobId}`;
      await logAdminActivity('ASSIGN_TECHNICIAN', actionDesc, { jobId, techId, jobObj });

      toast.success(techId ? 'Teknisi berhasil ditugaskan!' : 'Penugasan teknisi dibatalkan!');
      fetchInitialData();
    } catch (error) {
      toast.error('Gagal memperbarui penugasan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'tag-success';
      case 'in_progress': return 'tag-primary';
      case 'cancelled': return 'tag-error';
      default: return 'tag-pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Dalam Pengerjaan';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Menunggu';
    }
  };

  return (
    <div className="dashboard-container">
      <TopHeader title="Servis & Pemeliharaan" subtitle={isAdmin ? "Panel Penugasan Admin" : "Daftar Tugas Anda"} />

      <div className="page-content fade-in">
        {isAdmin && (
          <section className="service-booking card-elevation">
            <h3>Buat Penugasan Baru</h3>
            <p className="subtitle">Tugaskan teknisi untuk jadwal servis mendatang.</p>
            
            <div className="form-grid" style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <div className="form-group">
                <label>Pelanggan</label>
                <select 
                  className="service-select"
                  value={newJob.customer_id}
                  onChange={(e) => setNewJob({...newJob, customer_id: e.target.value})}
                >
                  <option value="">Pilih Pelanggan</option>
                  {customers.length === 0 && (
                    <option disabled>⚠️ Belum ada pelanggan / periksa konsol</option>
                  )}
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.phone || c.id}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Pilih Teknisi</label>
                <select 
                  className="service-select"
                  value={newJob.technician_id}
                  onChange={(e) => setNewJob({...newJob, technician_id: e.target.value})}
                >
                  <option value="">Pilih Teknisi</option>
                  {technicians.length === 0 && (
                    <option disabled>⚠️ Belum ada teknisi / periksa konsol</option>
                  )}
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email || t.id}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Jenis Layanan</label>
                <select 
                  className="service-select"
                  value={newJob.service_type}
                  onChange={(e) => setNewJob({...newJob, service_type: e.target.value})}
                >
                  <option>Cuci AC Rutin</option>
                  <option>Isi Freon</option>
                  <option>Perbaikan Kompresor</option>
                  <option>Pengecekan Umum</option>
                  <option>Pasang AC Baru</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tanggal Jadwal</label>
                <input 
                  type="date" 
                  className="service-select" 
                  value={newJob.scheduled_date}
                  onChange={(e) => setNewJob({...newJob, scheduled_date: e.target.value})}
                />
              </div>
            </div>
            
            <Button 
              fullWidth 
              icon={saving ? Loader2 : Calendar} 
              className="mt-4" 
              onClick={handleCreateJob}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Tugaskan Teknisi'}
            </Button>
          </section>
        )}

        <section className="service-history mt-6">
          <h3 className="section-title">{isAdmin ? "Semua Jadwal Servis" : "Tugas Servis Saya"}</h3>
          
          {loading ? (
            <InlineLoader text="Memuat tugas..." />
          ) : (
            <div className="timeline">
              {jobs.length > 0 ? (
                jobs.map(job => (
                  <div key={job.id} className="timeline-item">
                    <div className={`timeline-icon ${job.status === 'completed' ? 'bg-success' : 'bg-primary'}`}>
                      {job.status === 'completed' ? <CheckCircle size={16} /> : <Wrench size={16} />}
                    </div>
                    <div className="timeline-content card-elevation">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4>{job.service_type} - {job.customers?.name || job._creatorName || 'Pelanggan'}</h4>
                          <p className="time">
                            <Clock size={12} className="inline-icon" /> {new Date(job.scheduled_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginBottom: '8px' }}>
                            <User size={12} className="inline-icon" /> Teknisi: {job._technicianName || <span style={{ color: '#b57a00', fontWeight: 'bold' }}>Belum ditunjuk</span>}
                          </p>
                        </div>
                        <div className={`status-tag ${getStatusClass(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </div>
                      </div>

                      {/* Detail keluhan & alamat */}
                      {(job.complaint_description || job.service_address || job.notes) && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-container-low)',
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          borderLeft: '3px solid var(--color-outline-variant)'
                        }}>
                          {job.complaint_description && (
                            <div>
                              <strong>Keluhan:</strong> {job.complaint_description}
                            </div>
                          )}
                          {job.service_address && (
                            <div>
                              <strong>Alamat:</strong> {job.service_address}
                            </div>
                          )}
                          {job.notes && (
                            <div style={{ color: 'var(--color-outline)' }}>
                              <strong>Catatan/Kontak:</strong> {job.notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dropdown penugasan teknisi oleh Admin */}
                      {isAdmin && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '10px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                            Tugaskan / Ganti Teknisi:
                          </label>
                          <select
                            className="service-select"
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              height: 'auto',
                              width: '100%',
                              maxWidth: '220px',
                              backgroundPosition: 'right 8px center',
                              backgroundSize: '12px',
                              paddingRight: '28px'
                            }}
                            value={job.technician_id || ''}
                            onChange={(e) => handleAssignTechnician(job.id, e.target.value)}
                          >
                            <option value="">-- Belum Ditugaskan --</option>
                            {technicians.map(t => (
                              <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!isAdmin && job.status !== 'completed' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          {job.status === 'pending' && (
                            <Button size="small" variant="primary" onClick={() => updateStatus(job.id, 'in_progress')}>
                              Mulai Kerja
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <Button size="small" variant="success" onClick={() => updateStatus(job.id, 'completed')}>
                              Selesai
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Calendar} text="Belum ada jadwal servis terdaftar." />
              )}
            </div>
          )}
        </section>
      </div>

      <Navigation />
    </div>
  );
};

export default ServiceMaintenance;


