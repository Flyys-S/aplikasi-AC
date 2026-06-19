import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2, User, FileText, CheckCircle, PenTool, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import toast from 'react-hot-toast';
import './TechnicianReport.css';

const initialMeasurements = [
  { id: '1.0', category: 'Kelistrikan / Electricity', parameter: '1.0. Voltage (220-240V)', unit: 'V', reference: 'Drop Voltage ± 10%', before: '', after: '' },
  { id: '1.1', category: 'Kelistrikan / Electricity', parameter: '1.1. Voltage - (R - S) (380 - 410 V)', unit: 'V', reference: 'unbalance ± 2%', before: '', after: '' },
  { id: '1.2', category: 'Kelistrikan / Electricity', parameter: '1.2. Voltage - (S - T) (380 - 410 V)', unit: 'V', reference: 'unbalance ± 2%', before: '', after: '' },
  { id: '1.3', category: 'Kelistrikan / Electricity', parameter: '1.3. Voltage - (R - T) (380 - 410 V)', unit: 'V', reference: 'unbalance ± 2%', before: '', after: '' },
  { id: '1.4', category: 'Kelistrikan / Electricity', parameter: '1.4. Ampere Total', unit: 'A', reference: '', before: '', after: '' },
  { id: '1.5', category: 'Kelistrikan / Electricity', parameter: '1.5. Ampere Comp', unit: 'A', reference: '', before: '', after: '' },
  
  { id: '2.1', category: 'Suhu / Temperature', parameter: '2.1. Temperatur Evaporator (TE)', unit: '°C', reference: 'Factory Setting 6°C', before: '', after: '' },
  { id: '2.2', category: 'Suhu / Temperature', parameter: '2.2. Temperature Kondensor (TC)', unit: '°C', reference: 'Temperatur Ambient + 15 hingga 20°C', before: '', after: '' },
  { id: '2.3', category: 'Suhu / Temperature', parameter: '2.3. Pipa Discharge', unit: '°C', reference: 'Temperatur kondensor + 20 hingga 25°C', before: '', after: '' },
  { id: '2.4', category: 'Suhu / Temperature', parameter: '2.4. Pipa Hisap (Suction)', unit: '°C', reference: 'Temperatur Evaporator + 2 hingga 8°C', before: '', after: '' },
  { id: '2.5', category: 'Suhu / Temperature', parameter: '2.5. Inlet Outdoor Air', unit: '°C', reference: '', before: '', after: '' },
  { id: '2.6', category: 'Suhu / Temperature', parameter: '2.6. Outlet Outdoor Air', unit: '°C', reference: '', before: '', after: '' },
  { id: 'dt-out', category: 'Suhu / Temperature', parameter: 'Δ T (Outlet - Inlet)', unit: '°C', reference: 'Temp Return + 12 s.d 18', before: '', after: '' },
  { id: '2.7', category: 'Suhu / Temperature', parameter: '2.7. Inlet Indoor Air', unit: '°C', reference: '', before: '', after: '' },
  { id: '2.8', category: 'Suhu / Temperature', parameter: '2.8. Outlet Indoor Air', unit: '°C', reference: '', before: '', after: '' },
  { id: 'dt-in', category: 'Suhu / Temperature', parameter: 'Δ T (Outlet - Inlet)', unit: '°C', reference: 'Temp Return + 7 s.d 13', before: '', after: '' },
  { id: '2.9', category: 'Suhu / Temperature', parameter: '2.9. Ambient Temp', unit: '°C', reference: '35 - 40 (tergantung Model)', before: '', after: '' },

  { id: '3.1-l', category: 'Tekanan / Presure', parameter: '3.1. Sebelum - Low', unit: 'Mpag/psig', reference: 'Sama dengan tekanan Saturasi Temperatur ambient', before: '', after: '' },
  { id: '3.1-h', category: 'Tekanan / Presure', parameter: '3.1. Sebelum - High', unit: 'Mpag/psig', reference: '', before: '', after: '' },
  { id: '3.2-l', category: 'Tekanan / Presure', parameter: '3.2. Saat Beroperasi - Low', unit: 'Mpag/psig', reference: '0,5 - 1.1 Mpag\n72,6 - 159,5 psig', before: '', after: '' },
  { id: '3.2-h', category: 'Tekanan / Presure', parameter: '3.2. Saat Beroperasi - High', unit: 'Mpag/psig', reference: '<5 HP\n2.1 - 3.3 Mpa\n304,5 - 478,6 psig', before: '', after: '' },
];

const TechnicianReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states matching App.tsx fields
  const [formData, setFormData] = useState({
    indoorModel: '', indoorSerial: '', outdoorModel: '', outdoorSerial: '',
    customerName: '', address: '', technicianName: '', technicianCodeBranch: '', reportNumber: '',
    errorCode: '', failureCause: '', placeOfFailure: '',
    operationMode: '', setTemp: '', fanSpeed: '', statusOperation: '',
    installationDate: '', deliveryDate: '', endDate: '',
    diagnosis: '', checkingResult: '', sparePartDamage: '',
    countermeasure: '', reportDate: new Date().toISOString().split('T')[0]
  });

  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState('Cuci AC');
  const [acBrand, setAcBrand] = useState('Daikin');
  const [acType, setAcType] = useState('Split Wall');

  const [measurements, setMeasurements] = useState(initialMeasurements);

  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      // Set default technician info
      setFormData(prev => ({
        ...prev,
        technicianName: user?.user_metadata?.full_name || user?.email || '',
        reportNumber: 'SVC-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000),
      }));

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
          setFormData(prev => ({
            ...prev,
            customerName: data.customers?.name || '',
            address: data.service_address || '',
            technicianName: user?.user_metadata?.full_name || user?.email || '',
          }));
          setCustomerPhone(data.customers?.phone || '');
          if (data.service_type) setServiceType(data.service_type);
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        toast.error('Gagal memuat detail tugas.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, user]);

  // Canvas Drawing logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);

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
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);

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
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0055FF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [loading, showPreview]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (formError) setFormError('');
  };

  const handleMeasurementChange = (id, field, value) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handlePreviewReport = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.reportNumber.trim() || (!formData.indoorModel.trim() && !formData.outdoorModel.trim())) {
      setFormError('Pastikan Nama Customer, No Laporan, dan Model Unit terisi!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setFormError('');
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitReport = async () => {
    try {
      setSaving(true);

      // Convert signature to image base64
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL() : null;

      const reportPayload = {
        job_id: jobId || null,
        technician_id: user?.id || null,
        customer_name: formData.customerName,
        customer_phone: customerPhone,
        service_address: formData.address,
        ac_brand: acBrand,
        ac_type: acType,
        service_type: serviceType,
        technician_action: formData.countermeasure, // map countermeasure
        technician_notes: formData.diagnosis + '\n' + formData.checkingResult + '\n' + formData.sparePartDamage,
        signature_url: signatureDataUrl,

        // New extended columns
        indoor_model: formData.indoorModel,
        indoor_serial: formData.indoorSerial,
        outdoor_model: formData.outdoorModel,
        outdoor_serial: formData.outdoorSerial,
        technician_name: formData.technicianName,
        technician_code_branch: formData.technicianCodeBranch,
        report_number: formData.reportNumber,
        installation_date: formData.installationDate,
        delivery_date: formData.deliveryDate,
        end_date: formData.endDate,
        error_code: formData.errorCode,
        failure_cause: formData.failureCause,
        place_of_failure: formData.placeOfFailure,
        operation_mode: formData.operationMode,
        set_temp: formData.setTemp,
        fan_speed: formData.fanSpeed,
        status_operation: formData.statusOperation,
        measurements: measurements,
        diagnosis: formData.diagnosis,
        checking_result: formData.checkingResult,
        spare_part_damage: formData.sparePartDamage,
        countermeasure: formData.countermeasure,
        report_date: formData.reportDate || new Date().toISOString().split('T')[0]
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
            technician_action: formData.countermeasure,
            technician_notes: formData.diagnosis + '\n' + formData.checkingResult + '\n' + formData.sparePartDamage,
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
      <TopHeader 
        title={showPreview ? "Preview Laporan Servis" : "Buat Laporan Servis"} 
        subtitle={showPreview ? "Periksa detail pengerjaan Anda sebelum dikirim" : "Catat spesifikasi unit & hasil pengerjaan lengkap"} 
        onBack={() => {
          if (showPreview) {
            setShowPreview(false);
          } else {
            navigate('/technician');
          }
        }} 
      />
      
      <div className="page-content fade-in report-page-content">
        {!showPreview ? (
          <form onSubmit={handlePreviewReport} className="report-card-form glass-panel">
            {formError && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                <span className="text-xl">⚠️</span> {formError}
              </div>
            )}

            {/* Card: Informasi Unit */}
            <div className="dash-card">
              <div className="card-header">
                <div className="card-icon">🖥️</div>
                <div>
                  <div className="card-title">Informasi Unit</div>
                  <div className="card-desc">Model dan serial number perangkat</div>
                </div>
              </div>
              <div className="form-grid col-4">
                <div className="form-group">
                  <label className="form-label">Model Indoor Unit</label>
                  <input type="text" id="indoorModel" value={formData.indoorModel} onChange={handleInputChange} className="form-input" placeholder="Indoor model" />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number Indoor</label>
                  <input type="text" id="indoorSerial" value={formData.indoorSerial} onChange={handleInputChange} className="form-input" placeholder="Indoor serial" />
                </div>
                <div className="form-group">
                  <label className="form-label">Model Outdoor Unit</label>
                  <input type="text" id="outdoorModel" value={formData.outdoorModel} onChange={handleInputChange} className="form-input" placeholder="Outdoor model" />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number Outdoor</label>
                  <input type="text" id="outdoorSerial" value={formData.outdoorSerial} onChange={handleInputChange} className="form-input" placeholder="Outdoor serial" />
                </div>
              </div>
            </div>

            {/* Card: Informasi Customer */}
            <div className="dash-card">
              <div className="card-header">
                <div className="card-icon">👤</div>
                <div>
                  <div className="card-title">Informasi Customer</div>
                  <div className="card-desc">Data pelanggan, tipe layanan, dan teknisi</div>
                </div>
              </div>
              <div className="form-grid col-4">
                <div className="form-group">
                  <label className="form-label">Nama Customer *</label>
                  <input type="text" id="customerName" required value={formData.customerName} onChange={handleInputChange} className="form-input" placeholder="Ketik nama customer..." />
                </div>
                <div className="form-group">
                  <label className="form-label">No. Telp Pelanggan</label>
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="form-input" placeholder="0812xxxxxx" />
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat</label>
                  <input type="text" id="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder="Alamat lengkap" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Layanan *</label>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="form-select">
                    <option value="Cuci AC">Cuci AC</option>
                    <option value="Isi Freon">Isi Freon</option>
                    <option value="Perbaikan AC">Perbaikan AC</option>
                    <option value="Instalasi Baru">Instalasi Baru</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Merk AC *</label>
                  <select value={acBrand} onChange={(e) => setAcBrand(e.target.value)} className="form-select">
                    <option value="Daikin">Daikin</option>
                    <option value="Panasonic">Panasonic</option>
                    <option value="Sharp">Sharp</option>
                    <option value="LG">LG</option>
                    <option value="Gree">Gree</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis AC *</label>
                  <select value={acType} onChange={(e) => setAcType(e.target.value)} className="form-select">
                    <option value="Split Wall">Split Wall</option>
                    <option value="Cassette">Cassette</option>
                    <option value="Standing Floor">Standing Floor</option>
                    <option value="Central/Ducted">Central/Ducted</option>
                    <option value="Inverter">Inverter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Teknisi</label>
                  <input type="text" id="technicianName" value={formData.technicianName} onChange={handleInputChange} className="form-input" placeholder="Nama teknisi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kode Teknisi/Cabang</label>
                  <input type="text" id="technicianCodeBranch" value={formData.technicianCodeBranch} onChange={handleInputChange} className="form-input" placeholder="Kode teknisi/cabang" />
                </div>
                <div className="form-group">
                  <label className="form-label">No Laporan *</label>
                  <input type="text" id="reportNumber" required value={formData.reportNumber} onChange={handleInputChange} className="form-input" placeholder="No laporan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Installation Date</label>
                  <input type="text" id="installationDate" value={formData.installationDate} onChange={handleInputChange} className="form-input" placeholder="Misal: 15 April 2026" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Date</label>
                  <input type="text" id="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} className="form-input" placeholder="Misal: 01 January 1999" />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="text" id="endDate" value={formData.endDate} onChange={handleInputChange} className="form-input" placeholder="Misal: 15 April 2026" />
                </div>
              </div>
            </div>

            {/* Card: Detail Kerusakan */}
            <div className="dash-card">
              <div className="card-header">
                <div className="card-icon">⚠️</div>
                <div>
                  <div className="card-title">Detail Kerusakan & Operasional</div>
                  <div className="card-desc">Kode error, penyebab kerusakan & mode sistem</div>
                </div>
              </div>
              <div className="form-grid col-4">
                <div className="form-group">
                  <label className="form-label">Error Code</label>
                  <input type="text" id="errorCode" value={formData.errorCode} onChange={handleInputChange} className="form-input" placeholder="Kode error" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cause of Failure</label>
                  <input type="text" id="failureCause" value={formData.failureCause} onChange={handleInputChange} className="form-input" placeholder="Penyebab kerusakan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Place of Failure</label>
                  <input type="text" id="placeOfFailure" value={formData.placeOfFailure} onChange={handleInputChange} className="form-input" placeholder="Lokasi kerusakan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode Operasi</label>
                  <select id="operationMode" value={formData.operationMode} onChange={handleInputChange} className="form-select">
                    <option value="">Pilih mode...</option>
                    <option value="Cool">❄️ Cool</option>
                    <option value="Heat">🔥 Heat</option>
                    <option value="Auto">🔄 Auto</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Setting Temp (°C)</label>
                  <input type="text" id="setTemp" value={formData.setTemp} onChange={handleInputChange} className="form-input" placeholder="Setting suhu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fan Speed</label>
                  <input type="text" id="fanSpeed" value={formData.fanSpeed} onChange={handleInputChange} className="form-input" placeholder="Fan speed" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Operation</label>
                  <input type="text" id="statusOperation" value={formData.statusOperation} onChange={handleInputChange} className="form-input" placeholder="Status operasi" />
                </div>
              </div>
            </div>

            {/* Card: Tabel Pengukuran */}
            <div className="dash-card">
              <div className="card-header">
                <div className="card-icon">📊</div>
                <div>
                  <div className="card-title">Tabel Pengukuran</div>
                  <div className="card-desc">Data pengukuran kelistrikan, suhu, dan tekanan AC</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="measure-form-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Parameter</th>
                      <th>Satuan</th>
                      <th>Referensi</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map(m => (
                      <tr key={m.id}>
                        <td className="category-td text-xs font-semibold text-slate-500 max-w-[120px] whitespace-normal" data-label="Kategori">{m.category}</td>
                        <td className="w-48" data-label="Parameter">
                          <input type="text" value={m.parameter} onChange={e => handleMeasurementChange(m.id, 'parameter', e.target.value)} className="measure-input" />
                        </td>
                        <td className="w-24" data-label="Satuan">
                          <input type="text" value={m.unit} onChange={e => handleMeasurementChange(m.id, 'unit', e.target.value)} className="measure-input text-center" />
                        </td>
                        <td className="w-32" data-label="Referensi">
                          <textarea value={m.reference} onChange={e => handleMeasurementChange(m.id, 'reference', e.target.value)} className="measure-input" style={{ minHeight: '40px', py: '4px', fontSize: '11px' }} />
                        </td>
                        <td className="w-28" data-label="Before">
                          <input type="text" value={m.before} onChange={e => handleMeasurementChange(m.id, 'before', e.target.value)} className="measure-input" />
                        </td>
                        <td className="w-28" data-label="After">
                          <input type="text" value={m.after} onChange={e => handleMeasurementChange(m.id, 'after', e.target.value)} className="measure-input" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card: Catatan Teknisi */}
            <div className="dash-card">
              <div className="card-header">
                <div className="card-icon">📝</div>
                <div>
                  <div className="card-title">Catatan & Diagnosa Kerja</div>
                  <div className="card-desc">Detail kondisi sebelum dan sesudah perbaikan</div>
                </div>
              </div>
              <div className="form-grid col-2">
                <div className="form-group">
                  <label className="form-label">Faulty Diagnosis / Diagnosa Kerusakan</label>
                  <textarea id="diagnosis" value={formData.diagnosis} onChange={handleInputChange} rows={3} className="form-textarea" placeholder="Diagnosa masalah pada unit..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Checking Result / Hasil Pengecekan</label>
                  <textarea id="checkingResult" value={formData.checkingResult} onChange={handleInputChange} rows={3} className="form-textarea" placeholder="Hasil setelah pengecekan fisik..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Data Pengukuran Spare part Rusak</label>
                  <textarea id="sparePartDamage" value={formData.sparePartDamage} onChange={handleInputChange} rows={3} className="form-textarea" placeholder="Komponen bermasalah/rusak..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Countermeasure / Langkah Perbaikan *</label>
                  <textarea id="countermeasure" required value={formData.countermeasure} onChange={handleInputChange} rows={3} className="form-textarea" placeholder="Tindakan perbaikan yang dilakukan..." />
                </div>
              </div>
            </div>

            {/* Card: Tanda Tangan */}
            <div className="dash-card">
              <div className="signature-header">
                <label className="form-label">Tanda Tangan Pelanggan</label>
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

            {/* Action Bar */}
            <div className="action-bar">
              <button type="submit" className="btn-generate">
                🚀 Preview Laporan
              </button>
            </div>
          </form>
        ) : (
          <section className="preview-section">
            <div className="preview-topbar bg-white dark:bg-sage-900 border-[1.5px] border-sage-300 dark:border-sage-800 no-print">
              <div>
                <h2 className="text-lg font-bold">📄 Preview Laporan</h2>
                <p className="text-sm text-slate-500">Periksa detail dokumen sebelum dikirim</p>
              </div>
              <div className="preview-actions">
                <button onClick={() => setShowPreview(false)} className="btn-back">
                  <ArrowLeft size={16} className="inline mr-1" /> Edit Data
                </button>
                <button onClick={() => window.print()} className="btn-back">
                  <Download size={16} /> Cetak / PDF
                </button>
                <button onClick={handleSubmitReport} className="btn-download" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin-loader" /> : <Save size={16} />}
                  Kirim Laporan
                </button>
              </div>
            </div>

            <div id="printable-area" className="report-paper">
              {/* Letterhead */}
              <div className="rpt-letterhead">
                <div>
                  <div className="rpt-company-name">Mitra Maju Sejati</div>
                  <div className="rpt-company-sub">Service & Maintenance AC Profesional</div>
                </div>
                <div className="rpt-badge">MMS</div>
              </div>

              <div className="rpt-title">SERVICE REPORT DETAIL</div>

              {/* Info Table */}
              <table className="rpt-info-table">
                <tbody>
                  <tr>
                    <td className="rpt-key">Unit (In / Out)</td>
                    <td>{formData.indoorModel || '-'} / {formData.outdoorModel || '-'}</td>
                    <td className="rpt-key">Serial Number</td>
                    <td>{formData.indoorSerial || '-'} / {formData.outdoorSerial || '-'}</td>
                  </tr>
                  <tr>
                    <td className="rpt-key">Customer</td>
                    <td>{formData.customerName}</td>
                    <td className="rpt-key">Alamat</td>
                    <td>{formData.address || '-'}</td>
                  </tr>
                  <tr>
                    <td className="rpt-key">Teknisi</td>
                    <td>{formData.technicianName || '-'}</td>
                    <td className="rpt-key">No Laporan</td>
                    <td>{formData.reportNumber}</td>
                  </tr>
                  <tr>
                    <td className="rpt-key">Error Code</td>
                    <td>{formData.errorCode || '-'}</td>
                    <td className="rpt-key">Mode Operasi</td>
                    <td>{formData.operationMode || '-'} / {formData.setTemp || '-'}°C</td>
                  </tr>
                  <tr>
                    <td className="rpt-key">Cause of Failure</td>
                    <td colSpan={3}>{formData.failureCause || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Diagnosis */}
              <div className="rpt-section-label">Diagnosa Kerusakan</div>
              <div className="rpt-block">{formData.diagnosis || '-'}</div>

              {/* Checking Result */}
              <div className="rpt-section-label">Hasil Pengecekan</div>
              <div className="rpt-block">{formData.checkingResult || '-'}</div>

              {/* Measurement Table */}
              <div className="rpt-section-label">Data Pengukuran</div>
              <table className="rpt-measure-table">
                <thead>
                  <tr>
                    <th>Data Pengukuran</th>
                    <th>Satuan</th>
                    <th>Referensi</th>
                    <th>Data Before</th>
                    <th>Data After</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map(m => (
                    <tr key={m.id}>
                      <td>{m.parameter || '-'}</td>
                      <td>{m.unit || '-'}</td>
                      <td>{m.reference || '-'}</td>
                      <td>{m.before || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{m.after || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Countermeasure */}
              <div className="rpt-section-label">Countermeasure / Langkah Perbaikan</div>
              <div className="rpt-block-success">{formData.countermeasure || '-'}</div>

              {/* Signature block */}
              <div className="rpt-section-label">Persetujuan & Tanda Tangan</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '60px' }}>Teknisi MMS</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', borderTop: '1px solid #cbd5e1', paddingTop: '4px', width: '150px' }}>
                    {formData.technicianName}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Pelanggan</div>
                  {canvasRef.current && (
                    <img 
                      src={canvasRef.current.toDataURL()} 
                      alt="Tanda Tangan Pelanggan" 
                      style={{ height: '50px', objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} 
                    />
                  )}
                  <div style={{ fontSize: '13px', fontWeight: 'bold', borderTop: '1px solid #cbd5e1', paddingTop: '4px', width: '150px' }}>
                    {formData.customerName}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="rpt-footer">
                <span>No. Laporan: {formData.reportNumber}</span>
                <span>PT. Mitra Maju Sejati — Arctic Clarity</span>
                <span>Dicetak: {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </section>
        )}
      </div>
      <Navigation />
    </div>
  );
};

export default TechnicianReport;
