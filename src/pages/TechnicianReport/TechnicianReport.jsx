import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, ShieldAlert, Loader2, User, Phone, MapPin, CheckCircle, PenTool } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import toast from 'react-hot-toast';
import './TechnicianReport.css';

const TechnicianReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobData, setJobData] = useState(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [acBrand, setAcBrand] = useState('Daikin');
  const [acType, setAcType] = useState('Split Wall');
  const [serviceType, setServiceType] = useState('Cuci AC');
  const [technicianAction, setTechnicianAction] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('service_jobs')
          .select(`
            *,
            customers(name, phone)
          `)
          .eq('id', jobId)
          .single();

        if (error) throw error;
        if (data) {
          setJobData(data);
          setCustomerName(data.customers?.name || '');
          setCustomerPhone(data.customers?.phone || '');
          setServiceAddress(data.service_address || '');
          if (data.service_type) setServiceType(data.service_type);
          if (data.technician_action) setTechnicianAction(data.technician_action);
          if (data.technician_notes) setTechnicianNotes(data.technician_notes);
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        toast.error('Gagal memuat detail tugas.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Canvas Drawing logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid back
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0055FF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!technicianAction.trim()) {
      toast.error('Tindakan servis wajib diisi!');
      return;
    }

    try {
      setSaving(true);

      // Convert signature to image base64
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL() : null;

      const reportPayload = {
        job_id: jobId || null,
        technician_id: user?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_address: serviceAddress,
        ac_brand: acBrand,
        ac_type: acType,
        service_type: serviceType,
        technician_action: technicianAction,
        technician_notes: technicianNotes,
        signature_url: signatureDataUrl,
      };

      const { error: reportError } = await supabase
        .from('service_reports')
        .insert([reportPayload]);

      if (reportError) throw reportError;

      // Update status di service_jobs jika terhubung
      if (jobId) {
        await supabase
          .from('service_jobs')
          .update({
            status: 'completed',
            technician_action: technicianAction,
            technician_notes: technicianNotes,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      toast.success('🎉 Laporan Servis berhasil dikirim!');
      navigate('/technician');
    } catch (err) {
      toast.error('Gagal menyimpan laporan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="report-loading-container">
        <Loader2 size={36} className="spin-loader" />
        <p>Memuat formulir laporan...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <TopHeader title="Buat Laporan Servis" subtitle="Catat detail pengerjaan Anda" onBack={() => navigate('/technician')} />
      
      <div className="page-content fade-in report-page-content">
        <form onSubmit={handleSubmit} className="report-card-form glass-panel">
          <div className="report-section-title">
            <User size={18} />
            <span>Informasi Pelanggan</span>
          </div>

          <div className="report-input-group">
            <label>Nama Pelanggan *</label>
            <input 
              type="text" 
              required 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div className="report-input-grid">
            <div className="report-input-group">
              <label>No. Telp Pelanggan</label>
              <input 
                type="tel" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                placeholder="0812xxxxxx"
              />
            </div>
            <div className="report-input-group">
              <label>Tipe Layanan *</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="Cuci AC">Cuci AC</option>
                <option value="Isi Freon">Isi Freon</option>
                <option value="Perbaikan AC">Perbaikan AC</option>
                <option value="Instalasi Baru">Instalasi Baru</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="report-input-group">
            <label>Alamat Servis *</label>
            <textarea 
              required 
              value={serviceAddress} 
              onChange={(e) => setServiceAddress(e.target.value)} 
              rows={2}
              placeholder="Jl. Mawar No. 10..."
            />
          </div>

          <div className="report-section-title mt-4">
            <PenTool size={18} />
            <span>Spesifikasi & Tindakan AC</span>
          </div>

          <div className="report-input-grid">
            <div className="report-input-group">
              <label>Merk AC *</label>
              <select value={acBrand} onChange={(e) => setAcBrand(e.target.value)}>
                <option value="Daikin">Daikin</option>
                <option value="Panasonic">Panasonic</option>
                <option value="Sharp">Sharp</option>
                <option value="LG">LG</option>
                <option value="Gree">Gree</option>
                <option value="Samsung">Samsung</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="report-input-group">
              <label>Jenis AC *</label>
              <select value={acType} onChange={(e) => setAcType(e.target.value)}>
                <option value="Split Wall">Split Wall</option>
                <option value="Cassette">Cassette</option>
                <option value="Standing Floor">Standing Floor</option>
                <option value="Central/Ducted">Central/Ducted</option>
                <option value="Inverter">Inverter</option>
              </select>
            </div>
          </div>

          <div className="report-input-group">
            <label>Tindakan Yang Dilakukan *</label>
            <textarea 
              required
              value={technicianAction} 
              onChange={(e) => setTechnicianAction(e.target.value)} 
              rows={3}
              placeholder="Jelaskan tindakan perbaikan/pembersihan AC secara rinci..."
            />
          </div>

          <div className="report-input-group">
            <label>Catatan Tambahan / Rekomendasi</label>
            <textarea 
              value={technicianNotes} 
              onChange={(e) => setTechnicianNotes(e.target.value)} 
              rows={2}
              placeholder="Catatan kondisi AC atau saran perbaikan di masa mendatang..."
            />
          </div>

          <div className="report-input-group">
            <div className="signature-header">
              <label>Tanda Tangan Pelanggan</label>
              <button type="button" className="btn-clear-sig" onClick={clearCanvas}>
                <Trash2 size={14} /> Bersihkan
              </button>
            </div>
            <div className="signature-pad-container">
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit-report" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin-loader" /> : <Save size={18} />}
            Kirim Laporan Servis
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianReport;
