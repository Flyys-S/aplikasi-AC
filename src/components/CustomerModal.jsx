import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import './CustomerModal.css'

const CustomerModal = ({ onClose, onSave, initialData = {} }) => {
  const dialogRef = useRef(null)
  const [form, setForm] = useState({
    name: initialData.name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
  })
  const [saving, setSaving] = useState(false)

  // Show native modal using Dialog API on mount
  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [])

  const handleClose = () => {
    dialogRef.current?.close()
    onClose()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    handleClose()
  }

  // Close when clicking directly on the backdrop (outside dialog boundaries)
  const handleBackdropClick = (e) => {
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect()
      const isInDialog = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      )
      if (!isInDialog) {
        handleClose()
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="native-modal glass-panel fade-in"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
    >
      <div className="modal-sheet-inner">
        <div className="modal-header">
          <h3>{initialData.id ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input
                className="modal-input"
                placeholder="Bpk. / Ibu..."
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Nomor HP / WhatsApp *</label>
              <input
                className="modal-input"
                placeholder="08xxxxxxxxxx"
                required
                pattern="^[0-9+ \-]{8,15}$"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                className="modal-input"
                placeholder="email@contoh.com"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Alamat *</label>
              <textarea
                className="modal-input modal-textarea"
                placeholder="Alamat lengkap..."
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

export default CustomerModal
