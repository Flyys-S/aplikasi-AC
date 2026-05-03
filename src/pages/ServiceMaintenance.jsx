import React from 'react';
import { Calendar, PenTool, CheckCircle, Clock } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import BottomNavigation from '../components/BottomNavigation';
import Button from '../components/Button';
import './SalesDashboard.css';
import './ServiceMaintenance.css';

const ServiceMaintenance = () => {
  return (
    <div className="dashboard-container fade-in">
      <TopHeader title="Servis & Pemeliharaan" subtitle="Jadwal dan Log Servis" />

      <div className="page-content">
        <section className="service-booking card-elevation">
          <h3>Buat Jadwal Servis</h3>
          <p className="subtitle">Jadwalkan teknisi untuk perbaikan atau pemeliharaan rutin.</p>
          
          <div className="form-group">
            <label>Pilih Layanan</label>
            <select className="service-select">
              <option>Cuci AC Rutin</option>
              <option>Isi Freon</option>
              <option>Perbaikan Kompresor</option>
              <option>Pengecekan Umum</option>
            </select>
          </div>
          
          <Button fullWidth icon={Calendar} className="mt-4">
            Pilih Tanggal & Waktu
          </Button>
        </section>

        <section className="service-history mt-6">
          <h3 className="section-title">Jadwal Mendatang</h3>
          
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon bg-primary">
                <PenTool size={16} />
              </div>
              <div className="timeline-content card-elevation">
                <h4>Servis Rutin - Bpk. Ahmad</h4>
                <p className="time"><Clock size={12} className="inline-icon" /> Besok, 10:00 AM</p>
                <div className="status-tag tag-pending">Menunggu Teknisi</div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon bg-success">
                <CheckCircle size={16} />
              </div>
              <div className="timeline-content card-elevation opacity-70">
                <h4>Perbaikan Freon - Ibu Siti</h4>
                <p className="time"><Clock size={12} className="inline-icon" /> Kemarin, 14:00 PM</p>
                <div className="status-tag tag-success">Selesai</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ServiceMaintenance;
