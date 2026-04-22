import React, { useState } from 'react'
import { X } from 'lucide-react'
import './CustomerModal.css'

const CustomerModal = ({ onClose, onSave, initialData = {} }) => {
  const [form, setForm] = useState({
    name: initialData.name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData.id ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Nama Lengkap *</label>
            <input className="modal-input" placeholder="Bpk. / Ibu..."
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nomor HP / WhatsApp *</label>
            <input className="modal-input" placeholder="08xxxxxxxxxx"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="modal-input" placeholder="email@contoh.com" type="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Alamat *</label>
            <textarea className="modal-input modal-textarea" placeholder="Alamat lengkap..."
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerModal
