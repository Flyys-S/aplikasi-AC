import React, { useState, useEffect } from 'react';
import { Calendar, PenTool, CheckCircle, Clock, User, Plus, Loader2, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
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

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch Jobs
      let jobsQuery = supabase
        .from('service_jobs')
        .select(`
          *,
          customers(name, phone),
          profiles:technician_id(full_name, email)
        `)
        .order('scheduled_date', { ascending: false });

      if (!isAdmin) {
        jobsQuery = jobsQuery.eq('technician_id', user?.id);
      }

      const { data: jobsData, error: jobsError } = await jobsQuery;
      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      if (isAdmin) {
        // Fetch Technicians
        const { data: techData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'technician');
        setTechnicians(techData || []);

        // Fetch Customers
        const { data: custData } = await supabase
          .from('customers')
          .select('id, name')
          .order('name');
        setCustomers(custData || []);
      }
    } catch (error) {
      console.error('Error fetching service data:', error.message);
    } finally {
      setLoading(false);
    }
  };

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
      fetchInitialData();
      toast.success('Status berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal update status: ' + error.message);
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
    <div className="dashboard-container fade-in">
      <TopHeader title="Servis & Pemeliharaan" subtitle={isAdmin ? "Panel Penugasan Admin" : "Daftar Tugas Anda"} />

      <div className="page-content">
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
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4>{job.service_type} - {job.customers?.name || 'Pelanggan'}</h4>
                          <p className="time"><Clock size={12} className="inline-icon" /> {new Date(job.scheduled_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                            <User size={12} className="inline-icon" /> Teknisi: {job.profiles?.full_name || 'Belum ditunjuk'}
                          </p>
                        </div>
                        <div className={`status-tag ${getStatusClass(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </div>
                      </div>

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


