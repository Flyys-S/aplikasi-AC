export const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return { label: 'Selesai', color: '#008756', bg: 'rgba(0,135,86,0.1)' };
    case 'pending_verification': return { label: 'Menunggu', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' };
    case 'in_progress': return { label: 'Proses', color: '#1890ff', bg: 'rgba(24,144,255,0.1)' };
    case 'pending': return { label: 'Menunggu', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' };
    case 'cancelled': return { label: 'Dibatalkan', color: '#ff4444', bg: 'rgba(255,68,68,0.1)' };
    default: return { label: status, color: '#666', bg: '#eee' };
  }
};
