export const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return { label: 'Selesai', color: '#008756', bg: 'rgba(0,135,86,0.1)' };
    case 'pending_verification': return { label: 'Menunggu Verifikasi', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' };
    case 'paid': return { label: 'Dibayar', color: '#1890ff', bg: 'rgba(24,144,255,0.1)' };
    case 'shipping': return { label: 'Dikirim', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' };
    case 'delivered': return { label: 'Sampai', color: '#059669', bg: 'rgba(5,150,105,0.1)' };
    case 'in_progress': return { label: 'Proses', color: '#1890ff', bg: 'rgba(24,144,255,0.1)' };
    case 'pending': return { label: 'Menunggu', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' };
    case 'cancelled': return { label: 'Dibatalkan', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' };
    default: return { label: status, color: '#666', bg: '#eee' };
  }
};

/**
 * Returns the current step index (0–3) for the delivery tracking stepper.
 * Steps: 0=Pesanan Dibuat, 1=Menunggu Kurir, 2=Pesanan Dikirim, 3=Pesanan Sampai
 */
export const getOrderProgress = (status) => {
  switch (status) {
    case 'pending_verification': return 0;
    case 'paid': return 1;
    case 'shipping': return 2;
    case 'delivered':
    case 'completed': return 3;
    case 'cancelled': return -1;
    default: return 0;
  }
};

