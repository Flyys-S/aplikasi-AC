import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Phone, BookOpen, Package, Wrench,
  ChevronRight, Loader2, Star, Headphones,
  Sun, Moon, Plus, X, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, FileText, Send, ArrowLeft, Menu
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatRupiah, formatTanggalJam } from '../../lib/formatters';
import toast from 'react-hot-toast';
import './VisitorDashboard.css';

/* ─── Helpers ─── */
const getOrderStatusLabel = (s) => ({
  pending_verification: 'Menunggu Verifikasi',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}[s] || s);

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
  'Perbaikan Kompresor',
  'Pengecekan Umum',
  'Pasang AC Baru',
  'Bongkar AC',
  'Perbaikan Kebocoran Pipa',
];

const WA_NUMBER = '6281234567890'; // ← Ganti dengan nomor WA toko

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const VisitorDashboard = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /* ── State ── */
  const [products, setProducts]       = useState([]);
  const [orders, setOrders]           = useState([]);
  const [serviceReqs, setServiceReqs] = useState([]);

  const [loadingProducts, setLoadingProducts]     = useState(true);
  const [loadingOrders, setLoadingOrders]         = useState(true);
  const [loadingServices, setLoadingServices]     = useState(true);
  const [submitting, setSubmitting]               = useState(false);

  /* ── Form state ── */
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    service_type:            'Cuci AC Rutin',
    complaint_description:   '',
    service_address:         '',
    scheduled_date:          new Date().toISOString().split('T')[0],
    contact_phone:           '',
  });

  /* ── Auth guard ── */
  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (role && role !== 'visitor') { navigate('/', { replace: true }); }
  }, [user, role, navigate]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, brand, price, stock, image_url')
        .order('brand')
        .limit(10);
      setProducts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingProducts(false); }
  }, []);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          id, status, created_at, total_amount,
          transaction_items(quantity, products(name, brand))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setOrders(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingOrders(false); }
  }, [user]);

  /* ── Fetch permintaan servis milik user ini ── */
  const fetchServiceRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('service_jobs')
        .select('id, service_type, complaint_description, service_address, scheduled_date, status, created_at, notes')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setServiceReqs(data || []);
    } catch (e) {
      console.error('[VisitorDashboard] Fetch service requests:', e.message);
    } finally {
      setLoadingServices(false);
    }
  }, [user]);

  useEffect(() => { fetchProducts(); },        [fetchProducts]);
  useEffect(() => { fetchOrders(); },          [fetchOrders]);
  useEffect(() => { fetchServiceRequests(); }, [fetchServiceRequests]);

  /* ── Submit permintaan servis ── */
  const handleSubmitService = async () => {
    if (!serviceForm.complaint_description.trim()) {
      toast.error('Mohon jelaskan keluhan Anda.');
      return;
    }
    if (!serviceForm.service_address.trim()) {
      toast.error('Mohon isi alamat servis.');
      return;
    }
    if (!serviceForm.scheduled_date) {
      toast.error('Mohon pilih tanggal yang diinginkan.');
      return;
    }

    try {
      setSubmitting(true);

      // Cari customer_id berdasarkan user_id (jika ada di tabel customers)
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
        technician_id:         null,          // akan diisi admin
        created_by:            user.id,
        ...(custData?.id ? { customer_id: custData.id } : {}),
      };

      const { error } = await supabase
        .from('service_jobs')
        .insert([insertPayload]);

      if (error) throw error;

      toast.success('✅ Permintaan servis berhasil dikirim! Admin akan segera menghubungi Anda.');
      setShowServiceForm(false);
      setServiceForm({
        service_type:          'Cuci AC Rutin',
        complaint_description: '',
        service_address:       '',
        scheduled_date:        new Date().toISOString().split('T')[0],
        contact_phone:         '',
      });
      fetchServiceRequests();
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengirim permintaan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Greeting ── */
  const hour        = new Date().getHours();
  const greeting    = hour < 11 ? 'Selamat Pagi'  : hour < 15 ? 'Selamat Siang'
                    : hour < 18 ? 'Selamat Sore'  : 'Selamat Malam';
  const greetEmoji  = hour < 11 ? '☀️' : hour < 15 ? '🌤️' : hour < 18 ? '🌅' : '🌙';
  const userName    = user?.email?.split('@')[0] || 'Pelanggan';
  const userAvatar  = userName.charAt(0).toUpperCase();
  const waMessage   = encodeURIComponent('Halo Mitra Maju Sejati, saya ingin menanyakan produk AC...');
  const waUrl       = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="dashboard-container">

      {/* ─── Header ─── */}
      <header className="top-header glass-panel">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {role === 'visitor' && (
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
          <div className="header-info">
            <h2>Beranda</h2>
            <p>Mitra Maju Sejati</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="user-avatar" onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }} title="Profil Saya">
            {userAvatar}
          </div>
        </div>
      </header>

      <div className="page-content fade-in">

        {/* ─── Hero Greeting ─── */}
        <div className="visitor-hero">
          <div className="visitor-hero-text">
            <p className="visitor-hero-greeting">{greetEmoji} {greeting},</p>
            <h2 className="visitor-hero-name">{userName}</h2>
            <p className="visitor-hero-sub">
              Selamat datang di portal pelanggan kami.<br />
              Pesan AC atau ajukan servis langsung di sini.
            </p>
          </div>
          <div className="visitor-hero-avatar">{userAvatar}</div>
        </div>

        {/* ─── Quick Actions (4 tombol) ─── */}
        <div className="visitor-quick-actions" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button id="btn-visitor-catalog" className="visitor-action-btn"
            onClick={() => navigate('/')}>
            <div className="visitor-action-icon catalog"><BookOpen size={18} /></div>
            <span className="visitor-action-label">Katalog</span>
          </button>
          <button id="btn-visitor-service" className="visitor-action-btn"
            onClick={() => setShowServiceForm(true)}>
            <div className="visitor-action-icon service"><Wrench size={18} /></div>
            <span className="visitor-action-label">Servis</span>
          </button>
          <button id="btn-visitor-orders" className="visitor-action-btn"
            onClick={() => document.getElementById('vd-orders-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="visitor-action-icon orders"><ShoppingBag size={18} /></div>
            <span className="visitor-action-label">Pesanan</span>
          </button>
          <a id="btn-visitor-wa" href={waUrl} target="_blank"
            rel="noopener noreferrer" className="visitor-action-btn">
            <div className="visitor-action-icon contact"><Phone size={18} /></div>
            <span className="visitor-action-label">Hubungi</span>
          </a>
        </div>

        {/* ─── PERMINTAAN SERVIS FORM CARD ─── */}
        <div className="vd-service-cta-card card-elevation" id="vd-service-section">
          <div className="vd-service-cta-left">
            <div className="vd-service-cta-icon">
              <Wrench size={22} />
            </div>
            <div>
              <h4>Butuh Servis AC?</h4>
              <p>Ajukan permintaan sekarang, teknisi kami siap membantu.</p>
            </div>
          </div>
          <button
            id="btn-open-service-form"
            className="vd-service-cta-btn"
            onClick={() => setShowServiceForm(true)}
          >
            <Plus size={18} />
            Ajukan
          </button>
        </div>

        {/* ─── Riwayat Permintaan Servis ─── */}
        <div className="vd-section-header" style={{ marginTop: 4 }}>
          <h3 className="vd-section-title">🔧 Servis Saya</h3>
          <button className="vd-see-all-btn"
            onClick={() => setShowServiceForm(true)}>
            + Tambah
          </button>
        </div>

        {loadingServices ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader2 size={26} className="vd-spinner" color="var(--color-primary)" />
          </div>
        ) : serviceReqs.length === 0 ? (
          <div className="vd-empty" style={{ marginBottom: 20 }}>
            <div className="vd-empty-icon"><Wrench size={26} /></div>
            <p>Belum ada permintaan servis. Ketuk tombol Ajukan untuk memulai.</p>
          </div>
        ) : (
          <div className="vd-service-list">
            {serviceReqs.map(req => (
              <div key={req.id} className="vd-service-card card-elevation">
                <div className="vd-service-card-header">
                  <div className="vd-service-type-badge">
                    <Wrench size={13} />
                    {req.service_type}
                  </div>
                  <span className={`vd-service-status ${getServiceStatusClass(req.status)}`}>
                    {req.status === 'completed'   && <CheckCircle size={11} />}
                    {req.status === 'pending'      && <Clock size={11} />}
                    {req.status === 'in_progress' && <AlertCircle size={11} />}
                    {getServiceStatusLabel(req.status)}
                  </span>
                </div>
                {req.complaint_description && (
                  <p className="vd-service-complaint">
                    <FileText size={12} style={{ marginRight: 4 }} />
                    {req.complaint_description}
                  </p>
                )}
                <div className="vd-service-meta">
                  {req.service_address && (
                    <span className="vd-service-meta-item">
                      <MapPin size={11} />
                      {req.service_address.length > 40
                        ? req.service_address.substring(0, 40) + '...'
                        : req.service_address}
                    </span>
                  )}
                  <span className="vd-service-meta-item">
                    <Calendar size={11} />
                    {new Date(req.scheduled_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="vd-service-created">
                  Dikirim: {formatTanggalJam(req.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Katalog ─── */}
        <div className="vd-section-header">
          <h3 className="vd-section-title">🛒 Katalog AC</h3>
          <button className="vd-see-all-btn" onClick={() => navigate('/')}>
            Lihat Semua →
          </button>
        </div>

        {loadingProducts ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader2 size={26} className="vd-spinner" color="var(--color-primary)" />
          </div>
        ) : (
          <div className="vd-products-scroll">
            {products.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon"><Package size={26} /></div>
                <p>Belum ada produk di katalog.</p>
              </div>
            ) : products.map(product => (
              <div key={product.id} className="vd-product-card"
                id={`vd-product-${product.id}`} onClick={() => navigate('/')}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="vd-product-image" />
                ) : (
                  <div className="vd-product-image-placeholder"><Package size={26} /></div>
                )}
                <p className="vd-product-brand">{product.brand}</p>
                <p className="vd-product-name">{product.name}</p>
                <p className="vd-product-price">{formatRupiah(product.price)}</p>
                <span className={`vd-product-stock-badge ${product.stock > 0 ? 'ready' : 'habis'}`}>
                  {product.stock > 0 ? `Ready ${product.stock}` : 'Habis'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Riwayat Pesanan ─── */}
        <div id="vd-orders-section" className="vd-section-header" style={{ marginTop: 8 }}>
          <h3 className="vd-section-title">📦 Pesanan Saya</h3>
        </div>
        {loadingOrders ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader2 size={26} className="vd-spinner" color="var(--color-primary)" />
          </div>
        ) : orders.length === 0 ? (
          <div className="vd-empty" style={{ marginBottom: 20 }}>
            <div className="vd-empty-icon"><ShoppingBag size={26} /></div>
            <p>Belum ada pesanan. Yuk mulai belanja dari katalog!</p>
          </div>
        ) : (
          <div className="vd-orders-list">
            {orders.map(order => {
              const firstItem   = order.transaction_items?.[0];
              const productName = firstItem?.products
                ? `${firstItem.products.brand} ${firstItem.products.name}` : 'Produk';
              const itemCount   = order.transaction_items?.length || 0;
              return (
                <div key={order.id} className="vd-order-card"
                  id={`vd-order-${order.id}`}
                  onClick={() => navigate(`/transactions/${order.id}`)}>
                  <div className="vd-order-icon"><ShoppingBag size={20} /></div>
                  <div className="vd-order-info">
                    <p className="vd-order-id">#{String(order.id).substring(0, 8).toUpperCase()}</p>
                    <p className="vd-order-product">
                      {productName}{itemCount > 1 ? ` +${itemCount - 1} item` : ''}
                    </p>
                    <p className="vd-order-date">{formatTanggalJam(order.created_at)}</p>
                  </div>
                  <div>
                    <span className={`vd-order-status ${order.status}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <ChevronRight size={16} style={{ display: 'block', margin: '6px auto 0',
                      color: 'var(--color-outline)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── WA Button ─── */}
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="vd-wa-btn" id="btn-wa-contact">
          <Headphones size={20} />
          Hubungi Kami via WhatsApp
        </a>

      </div>{/* /page-content */}

      {/* ═══════════════════════════════════════
          BOTTOM SHEET — Form Permintaan Servis
      ═══════════════════════════════════════ */}
      {showServiceForm && (
        <div className="vd-sheet-overlay" onClick={() => setShowServiceForm(false)}>
          <div className="vd-sheet-panel" onClick={e => e.stopPropagation()}>

            {/* Drag Handle */}
            <div className="vd-sheet-handle" />

            {/* Header */}
            <div className="vd-sheet-header">
              <div>
                <h3 className="vd-sheet-title">🔧 Ajukan Permintaan Servis</h3>
                <p className="vd-sheet-subtitle">
                  Isi formulir di bawah, admin akan menugaskan teknisi untuk Anda.
                </p>
              </div>
              <button className="icon-btn" onClick={() => setShowServiceForm(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="vd-sheet-body">

              {/* Jenis Servis */}
              <div className="vd-form-group">
                <label className="vd-form-label">Jenis Layanan</label>
                <select
                  id="service-type-select"
                  className="vd-form-select"
                  value={serviceForm.service_type}
                  onChange={e => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                >
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Keluhan */}
              <div className="vd-form-group">
                <label className="vd-form-label">
                  Keluhan / Deskripsi Masalah <span className="vd-form-required">*</span>
                </label>
                <textarea
                  id="service-complaint-input"
                  className="vd-form-textarea"
                  placeholder="Contoh: AC tidak dingin sama sekali, sudah 3 hari, ada suara berisik dari outdoor..."
                  rows={4}
                  value={serviceForm.complaint_description}
                  onChange={e => setServiceForm({ ...serviceForm, complaint_description: e.target.value })}
                />
              </div>

              {/* Alamat */}
              <div className="vd-form-group">
                <label className="vd-form-label">
                  <MapPin size={13} style={{ marginRight: 4 }} />
                  Alamat Servis <span className="vd-form-required">*</span>
                </label>
                <textarea
                  id="service-address-input"
                  className="vd-form-textarea"
                  placeholder="Jl. Contoh No. 10, RT 01/RW 02, Kel. ABC, Kec. XYZ, Kota..."
                  rows={3}
                  value={serviceForm.service_address}
                  onChange={e => setServiceForm({ ...serviceForm, service_address: e.target.value })}
                />
              </div>

              {/* Tanggal Preferensi */}
              <div className="vd-form-group">
                <label className="vd-form-label">
                  <Calendar size={13} style={{ marginRight: 4 }} />
                  Tanggal yang Diinginkan
                </label>
                <input
                  id="service-date-input"
                  type="date"
                  className="vd-form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={serviceForm.scheduled_date}
                  onChange={e => setServiceForm({ ...serviceForm, scheduled_date: e.target.value })}
                />
              </div>

              {/* Nomor Kontak */}
              <div className="vd-form-group">
                <label className="vd-form-label">
                  <Phone size={13} style={{ marginRight: 4 }} />
                  Nomor HP yang Bisa Dihubungi
                </label>
                <input
                  id="service-phone-input"
                  type="tel"
                  className="vd-form-input"
                  placeholder="08xxxxxxxxxx"
                  value={serviceForm.contact_phone}
                  onChange={e => setServiceForm({ ...serviceForm, contact_phone: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-service"
                className="vd-submit-btn"
                onClick={handleSubmitService}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={18} className="vd-spinner" /> Mengirim...</>
                  : <><Send size={18} /> Kirim Permintaan Servis</>
                }
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VisitorDashboard;
