import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calculator, ArrowLeft, Wind, Zap, RefreshCw, Sun, Info, Menu } from 'lucide-react';
import Button from '../../components/Button';
import TopHeader from '../../components/TopHeader';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../lib/formatters';
import './CalculatorTools.css';

const CalculatorTools = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'pk';

  const [activeTab, setActiveTab] = useState(initialTab);

  // PK Calculator States
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('3'); // standard height
  const [exposure, setExposure] = useState('standard'); // standard vs sunny/glass
  const [pkResult, setPkResult] = useState(null);

  // kWh Calculator States
  const [pkSize, setPkSize] = useState('0.5'); // 0.5, 0.75, 1, 1.5, 2
  const [acType, setAcType] = useState('standard'); // standard, low-watt, inverter
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [rate, setRate] = useState(1444.7); // standard Rp/kWh for R1/1300VA
  const [kwhResult, setKwhResult] = useState(null);

  // Calculate PK Logic
  const handleCalculatePK = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
      alert('Mohon masukkan dimensi ruangan yang valid.');
      return;
    }

    // Basic BTU = L * W * 500
    // Factor in height above 3m
    let multiplier = 500;
    if (h > 3) {
      multiplier += (h - 3) * 100;
    }
    
    // Factor in solar exposure
    if (exposure === 'sunny') {
      multiplier *= 1.2; // 20% more load
    }

    const btu = l * w * multiplier;
    
    let pk = '0.5';
    let label = '1/2 PK';
    if (btu <= 5000) { pk = '0.5'; label = '1/2 PK'; }
    else if (btu <= 7000) { pk = '0.75'; label = '3/4 PK'; }
    else if (btu <= 9000) { pk = '1.0'; label = '1 PK'; }
    else if (btu <= 12000) { pk = '1.5'; label = '1.5 PK'; }
    else if (btu <= 18000) { pk = '2.0'; label = '2 PK'; }
    else { pk = '2.5'; label = '2.5 PK atau lebih'; }

    setPkResult({ btu: Math.round(btu), pk, label });
  };

  // Calculate kWh & Monthly Bill Logic
  const handleCalculateKwh = () => {
    // Standard Watts based on PK and Type
    const wattMatrix = {
      '0.5': { standard: 390, 'low-watt': 320, inverter: 350 },
      '0.75': { standard: 590, 'low-watt': 490, inverter: 510 },
      '1.0': { standard: 840, 'low-watt': 660, inverter: 720 },
      '1.5': { standard: 1150, 'low-watt': 990, inverter: 960 },
      '2.0': { standard: 1660, 'low-watt': 1450, inverter: 1350 }
    };

    const watts = wattMatrix[pkSize][acType];
    const hrs = parseFloat(hoursPerDay);
    const r = parseFloat(rate);

    if (isNaN(hrs) || isNaN(r) || hrs <= 0 || hrs > 24 || r <= 0) {
      alert('Mohon masukkan jam penggunaan dan tarif yang valid.');
      return;
    }

    // Inverter efficiency factor (runs at average 60% capacity after first hour)
    const efficiencyFactor = acType === 'inverter' ? 0.65 : 1.0;

    // Daily consumption in kWh
    const dailyKwh = (watts * hrs * efficiencyFactor) / 1000;
    const monthlyKwh = dailyKwh * 30;
    const monthlyCost = monthlyKwh * r;

    setKwhResult({
      watts,
      dailyKwh: dailyKwh.toFixed(2),
      monthlyKwh: monthlyKwh.toFixed(2),
      monthlyCost: Math.round(monthlyCost)
    });
  };

  const isVisitorOrGuest = !user || role === 'visitor';
  const hasNormalSidebar = role === 'admin' || role === 'technician';
  const containerClass = hasNormalSidebar ? '' : (isVisitorOrGuest ? ' customer-layout' : ' guest-layout');

  return (
    <>
      <div className={`dashboard-container${containerClass}`}>
      <header className="catalog-header glass-panel calculator-header-custom">
        <div className="calculator-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isVisitorOrGuest && (
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
          )}
          {role !== 'visitor' && (
            <button className="icon-btn" onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="var(--color-primary)" /> Arctic Tools & Kalkulator
          </h2>
        </div>
      </header>

      <div className="page-content tools-page-content fade-in">
        {/* Navigation Tabs */}
        <div className="tools-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pk' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pk'); setPkResult(null); }}
          >
            🔌 Kalkulator PK AC
          </button>
          <button 
            className={`tab-btn ${activeTab === 'kwh' ? 'active' : ''}`}
            onClick={() => { setActiveTab('kwh'); setKwhResult(null); }}
          >
            ⚡ Kalkulator Biaya Listrik AC
          </button>
        </div>

        {/* 1. PK Calculator */}
        {activeTab === 'pk' && (
          <div className="tool-card glass-panel fade-in">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wind size={20} color="var(--color-primary)" /> Cari Ukuran PK AC yang Tepat
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
              Pendinginan optimal tercapai jika kapasitas AC (BTU) sesuai dengan volume ruangan dan faktor paparan panas matahari.
            </p>

            <div className="calc-grid mb-20">
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Panjang Ruangan (meter)</label>
                <input 
                  type="number" 
                  placeholder="Contoh: 4" 
                  value={length} 
                  onChange={(e) => setLength(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                />
              </div>
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Lebar Ruangan (meter)</label>
                <input 
                  type="number" 
                  placeholder="Contoh: 3" 
                  value={width} 
                  onChange={(e) => setWidth(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                />
              </div>
            </div>

            <div className="calc-grid mb-24">
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Tinggi Plafon (meter)</label>
                <input 
                  type="number" 
                  placeholder="Standar: 3" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                />
              </div>
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Paparan Sinar Matahari / Kaca</label>
                <select 
                  value={exposure} 
                  onChange={(e) => setExposure(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                >
                  <option value="standard">Normal / Sedikit Kaca (Tidak Terkena Matahari Langsung)</option>
                  <option value="sunny">Banyak Kaca / Menghadap Barat (Terkena Sinar Langsung)</option>
                </select>
              </div>
            </div>

            <Button fullWidth onClick={handleCalculatePK}>Hitung PK AC</Button>

            {pkResult && (
              <div className="result-display fade-in" style={{ marginTop: '28px', padding: '20px', borderRadius: '16px', background: 'rgba(0, 85, 255, 0.06)', border: '1px solid var(--color-primary)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: 'var(--color-primary)' }}>REKOMENDASI UNIT AC</h4>
                <div className="result-flex-container">
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-on-surface)' }}>{pkResult.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>Beban Pendinginan: {pkResult.btu} BTU</div>
                  </div>
                  <Button onClick={() => navigate(`/?search=${pkResult.pk}`)}>Saring Di Katalog</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. kWh/Electricity Cost Calculator */}
        {activeTab === 'kwh' && (
          <div className="tool-card glass-panel fade-in">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="var(--color-primary)" /> Estimasi Biaya Listrik Bulanan AC
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
              Hitung perkiraan tagihan listrik khusus untuk penggunaan unit AC berdasarkan tipe kompresor yang digunakan.
            </p>

            <div className="calc-grid mb-20">
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Kapasitas AC (PK)</label>
                <select 
                  value={pkSize} 
                  onChange={(e) => setPkSize(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                >
                  <option value="0.5">1/2 PK</option>
                  <option value="0.75">3/4 PK</option>
                  <option value="1.0">1 PK</option>
                  <option value="1.5">1.5 PK</option>
                  <option value="2.0">2 PK</option>
                </select>
              </div>
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Tipe AC</label>
                <select 
                  value={acType} 
                  onChange={(e) => setAcType(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                >
                  <option value="standard">Standard (Watt konstan)</option>
                  <option value="low-watt">Low Watt (Watt lebih kecil)</option>
                  <option value="inverter">Inverter (Hemat energi dinamis)</option>
                </select>
              </div>
            </div>

            <div className="calc-grid mb-24">
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Rata-rata Penggunaan (Jam/Hari)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="24" 
                  placeholder="Contoh: 8" 
                  value={hoursPerDay} 
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                />
              </div>
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Tarif Listrik PLN (Rp/kWh)</label>
                <input 
                  type="number" 
                  placeholder="Standar: 1444.7" 
                  value={rate} 
                  onChange={(e) => setRate(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)', color: 'inherit' }}
                />
              </div>
            </div>

            <Button fullWidth onClick={handleCalculateKwh}>Hitung Estimasi Biaya</Button>

            {kwhResult && (
              <div className="result-display fade-in" style={{ marginTop: '28px', padding: '20px', borderRadius: '16px', background: 'rgba(0, 185, 120, 0.06)', border: '1px solid #00B978' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#00B978' }}>PROYEKSI BIAYA LISTRIK (BULANAN)</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>Konsumsi Daya AC</span>
                    <span style={{ fontWeight: '700' }}>~ {kwhResult.watts} Watt</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>Kebutuhan kWh Bulanan</span>
                    <span style={{ fontWeight: '700' }}>{kwhResult.monthlyKwh} kWh</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--color-outline-variant)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                    <span style={{ fontWeight: '700' }}>Estimasi Tagihan</span>
                    <span style={{ fontWeight: '950', fontSize: '20px', color: '#00B978' }}>{formatRupiah(kwhResult.monthlyCost)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '14px', background: 'var(--color-surface-container-lowest)', padding: '10px 14px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Info size={14} style={{ color: '#00B978', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', lineHeight: 1.4 }}>
                    {acType === 'inverter' 
                      ? 'Tipe Inverter terhitung menggunakan konsumsi daya dinamis/fluktuatif (hemat hingga 35-50% setelah jam pertama).' 
                      : 'AC Non-Inverter terhitung dengan beban konstan sesuai rating pabrikan.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
      <Navigation />
    </>
  );
};

export default CalculatorTools;
