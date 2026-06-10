import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, FileText, Calendar, Search, SlidersHorizontal, Download, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import toast from 'react-hot-toast';
import './AdminReports.css';

const AdminReports = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil riwayat laporan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Hanya admin yang dapat mengakses halaman ini.');
      navigate('/');
      return;
    }
    fetchReports();
  }, [isAdmin, fetchReports, navigate]);

  const filteredReports = reports.filter(r => 
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ac_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = (report) => {
    // Generate browser print view / PDF download
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Servis AC - ${report.customer_name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 3px solid #0055FF; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #0055FF; margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .section { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0055FF; }
            .section h3 { margin-top: 0; color: #0055FF; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
            .row { display: flex; margin-bottom: 8px; font-size: 14px; }
            .label { width: 140px; font-weight: bold; color: #555; }
            .value { flex: 1; }
            .full-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #0055FF; }
            .full-section h3 { margin-top: 0; color: #0055FF; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
            .action-text { font-size: 15px; line-height: 1.6; white-space: pre-line; }
            .signature-box { margin-top: 50px; text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
            .signature-line { width: 200px; border-bottom: 1px solid #000; margin-top: 80px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ARCTIC CLARITY</h1>
            <p>PT. Mitra Maju Sejati · Laporan Servis AC Resmi</p>
          </div>
          <div class="grid">
            <div class="section">
              <h3>Detail Pelanggan</h3>
              <div class="row"><div class="label">Nama</div><div class="value">${report.customer_name}</div></div>
              <div class="row"><div class="label">Telepon</div><div class="value">${report.customer_phone || '-'}</div></div>
              <div class="row"><div class="label">Alamat</div><div class="value">${report.service_address}</div></div>
            </div>
            <div class="section">
              <h3>Spesifikasi AC</h3>
              <div class="row"><div class="label">Merk AC</div><div class="value">${report.ac_brand}</div></div>
              <div class="row"><div class="label">Tipe AC</div><div class="value">${report.ac_type}</div></div>
              <div class="row"><div class="label">Layanan</div><div class="value">${report.service_type}</div></div>
              <div class="row"><div class="label">Tanggal Laporan</div><div class="value">${new Date(report.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
            </div>
          </div>
          <div class="full-section">
            <h3>Tindakan Servis (Hasil Pekerjaan)</h3>
            <div class="action-text">${report.technician_action}</div>
          </div>
          ${report.technician_notes ? `
          <div class="full-section">
            <h3>Catatan Tambahan / Rekomendasi</h3>
            <div class="action-text">${report.technician_notes}</div>
          </div>` : ''}
          <div class="signature-box">
            <p style="margin-bottom: 10px; font-weight: bold;">Tanda Tangan Pelanggan</p>
            ${report.signature_url ? `<img src="${report.signature_url}" width="180" height="70" style="border: 1px solid #eee; background: white;" />` : '<div style="height: 70px;"></div>'}
            <div class="signature-line">${report.customer_name}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="dashboard-container" style={{ paddingLeft: '260px', transition: 'all 0.3s ease' }}>
      <TopHeader title="Riwayat Laporan Servis" subtitle="Daftar laporan hasil pengerjaan teknisi" />

      <div className="page-content fade-in reports-admin-content" style={{ paddingBottom: '100px' }}>
        
        {/* Search & Filter Row */}
        <div className="reports-search-row">
          <div className="reports-search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari nama pelanggan, merk AC, atau tipe servis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List of Reports */}
        {loading ? (
          <div className="reports-empty-state">
            <Loader2 size={36} className="spin-loader" />
            <p>Memuat riwayat laporan...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="reports-grid">
            {filteredReports.map(report => (
              <div key={report.id} className="report-card-admin glass-panel">
                <div className="report-card-header">
                  <div>
                    <h4 className="report-cust-name">{report.customer_name}</h4>
                    <p className="report-date">
                      <Calendar size={13} style={{ marginRight: 4 }} />
                      {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="report-tag-service">{report.service_type}</span>
                </div>

                <div className="report-card-body">
                  <div className="report-detail-text">
                    <strong>Alamat:</strong> {report.service_address}
                  </div>
                  <div className="report-detail-text">
                    <strong>Unit AC:</strong> {report.ac_brand} ({report.ac_type})
                  </div>
                  <div className="report-detail-text text-action">
                    <strong>Tindakan:</strong> {report.technician_action}
                  </div>
                </div>

                <div className="report-card-actions">
                  <button className="btn-report-action outline" onClick={() => setSelectedReport(report)}>
                    <Eye size={15} /> Detail
                  </button>
                  <button className="btn-report-action primary" onClick={() => handleDownloadPDF(report)}>
                    <Download size={15} /> Cetak PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="reports-empty-state">
            <FileText size={48} style={{ color: 'var(--color-outline)' }} />
            <h4>Belum ada laporan masuk</h4>
            <p>Semua laporan pengerjaan servis AC oleh teknisi akan tampil di sini.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="detail-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="detail-modal-sheet modal-report-details" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3>Detail Laporan Servis</h3>
              <button className="sheet-close-btn" onClick={() => setSelectedReport(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sheet-body">
              <div className="sheet-info-block">
                <div className="sheet-info-block-label">👤 Informasi Pelanggan</div>
                <div className="sheet-info-row"><strong>Nama:</strong> {selectedReport.customer_name}</div>
                <div className="sheet-info-row"><strong>Telepon:</strong> {selectedReport.customer_phone || '-'}</div>
                <div className="sheet-info-row"><strong>Alamat:</strong> {selectedReport.service_address}</div>
              </div>

              <div className="sheet-info-block">
                <div className="sheet-info-block-label">❄️ Detail Unit AC</div>
                <div className="sheet-info-row"><strong>Merk AC:</strong> {selectedReport.ac_brand}</div>
                <div className="sheet-info-row"><strong>Tipe AC:</strong> {selectedReport.ac_type}</div>
                <div className="sheet-info-row"><strong>Jenis Servis:</strong> {selectedReport.service_type}</div>
              </div>

              <div className="sheet-info-block">
                <div className="sheet-info-block-label">🔧 Tindakan Teknisi</div>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{selectedReport.technician_action}</p>
              </div>

              {selectedReport.technician_notes && (
                <div className="sheet-info-block">
                  <div className="sheet-info-block-label">📝 Catatan / Saran</div>
                  <p style={{ fontSize: 13, fontStyle: 'italic', margin: 0 }}>{selectedReport.technician_notes}</p>
                </div>
              )}

              {selectedReport.signature_url && (
                <div className="sheet-info-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="sheet-info-block-label" style={{ alignSelf: 'flex-start' }}>✍️ Tanda Tangan Pelanggan</div>
                  <img src={selectedReport.signature_url} alt="Tanda Tangan" className="modal-sig-image" />
                </div>
              )}

              <button className="btn-submit-report" style={{ width: '100%' }} onClick={() => handleDownloadPDF(selectedReport)}>
                <Download size={16} /> Cetak / Download PDF Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
