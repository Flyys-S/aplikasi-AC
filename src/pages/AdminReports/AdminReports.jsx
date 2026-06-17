import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, FileText, Calendar, Search, SlidersHorizontal, Download, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
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

    const measurementsHtml = (report.measurements || [])
      .map(
        (m) => `
      <tr>
        <td>${m.parameter || '-'}</td>
        <td>${m.unit || '-'}</td>
        <td>${m.reference || '-'}</td>
        <td>${m.before || '-'}</td>
        <td style="font-weight: 600;">${m.after || '-'}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>SERVICE REPORT DETAIL - ${report.customer_name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; }
            .rpt-letterhead {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px double #023e8a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .rpt-company-name {
              font-size: 26px;
              font-weight: 800;
              color: #023e8a;
              line-height: 1.1;
            }
            .rpt-company-sub {
              font-size: 13px;
              color: #64748b;
              margin-top: 4px;
            }
            .rpt-badge {
              background: #023e8a;
              color: white;
              padding: 8px 16px;
              font-weight: 800;
              font-size: 18px;
              border-radius: 8px;
              letter-spacing: 1px;
            }
            .rpt-title {
              font-size: 18px;
              font-weight: 800;
              text-align: center;
              color: #0f172a;
              letter-spacing: 0.5px;
              margin-bottom: 20px;
            }
            .rpt-info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .rpt-info-table td {
              padding: 8px 12px;
              border: 1px solid #cbd5e1;
              font-size: 12.5px;
            }
            .rpt-key {
              font-weight: 700;
              background: #f8fafc;
              color: #334155;
              width: 150px;
            }
            .rpt-section-label {
              font-size: 13px;
              font-weight: 800;
              color: #023e8a;
              background: #f1f5f9;
              padding: 6px 12px;
              border-left: 4px solid #023e8a;
              margin: 16px 0 10px;
              text-transform: uppercase;
            }
            .rpt-block {
              padding: 12px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              font-size: 13px;
              min-height: 60px;
              white-space: pre-wrap;
              background: #fafafa;
            }
            .rpt-block-success {
              padding: 12px;
              border: 1px solid #86efac;
              border-radius: 6px;
              font-size: 13px;
              min-height: 60px;
              white-space: pre-wrap;
              background: #f0fdf4;
              color: #166534;
              font-weight: 500;
            }
            .rpt-measure-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .rpt-measure-table th,
            .rpt-measure-table td {
              padding: 6px 10px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .rpt-measure-table th {
              background: #f8fafc;
              font-weight: 700;
              color: #334155;
            }
            .rpt-footer {
              margin-top: 32px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="rpt-letterhead">
            <div>
              <div class="rpt-company-name">Mitra Maju Sejati</div>
              <div class="rpt-company-sub">Service & Maintenance AC Profesional</div>
            </div>
            <div class="rpt-badge">MMS</div>
          </div>

          <div class="rpt-title">SERVICE REPORT DETAIL</div>

          <table class="rpt-info-table">
            <tbody>
              <tr>
                <td class="rpt-key">Unit (In / Out)</td>
                <td>${report.indoor_model || '-'} / ${report.outdoor_model || '-'}</td>
                <td class="rpt-key">Serial Number</td>
                <td>${report.indoor_serial || '-'} / ${report.outdoor_serial || '-'}</td>
              </tr>
              <tr>
                <td class="rpt-key">Customer</td>
                <td>${report.customer_name || '-'}</td>
                <td class="rpt-key">Alamat</td>
                <td>${report.service_address || '-'}</td>
              </tr>
              <tr>
                <td class="rpt-key">Teknisi</td>
                <td>${report.technician_name || '-'}</td>
                <td class="rpt-key">No Laporan</td>
                <td>${report.report_number || '-'}</td>
              </tr>
              <tr>
                <td class="rpt-key">Error Code</td>
                <td>${report.error_code || '-'}</td>
                <td class="rpt-key">Mode Operasi</td>
                <td>${report.operation_mode || '-'} / ${report.set_temp || '-'}°C</td>
              </tr>
              <tr>
                <td class="rpt-key">Cause of Failure</td>
                <td colSpan="3">${report.failure_cause || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div class="rpt-section-label">Diagnosa Kerusakan</div>
          <div class="rpt-block">${report.diagnosis || '-'}</div>

          <div class="rpt-section-label">Hasil Pengecekan</div>
          <div class="rpt-block">${report.checking_result || '-'}</div>

          <div class="rpt-section-label">Data Pengukuran</div>
          <table class="rpt-measure-table">
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
              ${measurementsHtml || '<tr><td colspan="5" style="text-align: center;">Tidak ada data pengukuran</td></tr>'}
            </tbody>
          </table>

          <div class="rpt-section-label">Countermeasure / Langkah Perbaikan</div>
          <div class="rpt-block-success">${report.countermeasure || '-'}</div>

          <div class="rpt-section-label">Persetujuan & Tanda Tangan</div>
          <div style="display: flex; justify-content: space-between; margin-top: 16px; padding: 0 20px;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 60px;">Teknisi MMS</div>
              <div style="font-size: 13px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 4px; width: 150px;">
                ${report.technician_name || '-'}
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">Pelanggan</div>
              ${report.signature_url ? `<img src="${report.signature_url}" alt="Tanda Tangan Pelanggan" style="height: 50px; object-fit: contain; display: block; margin: 0 auto 10px;" />` : '<div style="height: 50px; margin-bottom: 10px;"></div>'}
              <div style="font-size: 13px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 4px; width: 150px;">
                ${report.customer_name || '-'}
              </div>
            </div>
          </div>

          <div class="rpt-footer">
            <span>No. Laporan: ${report.report_number || '-'}</span>
            <span>PT. Mitra Maju Sejati — Arctic Clarity</span>
            <span>Dicetak: ${new Date().toLocaleDateString('id-ID')}</span>
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
    <div className="dashboard-container">
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
      <Navigation />
    </div>
  );
};

export default AdminReports;
