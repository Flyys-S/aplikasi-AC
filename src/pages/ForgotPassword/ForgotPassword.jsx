import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import { Mail, ArrowLeft } from 'lucide-react'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResetRequest = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Silakan masukkan email Anda.')
      return
    }

    try {
      setLoading(true)
      const redirectUrl = `${window.location.origin}/aplikasi-AC/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setSubmitted(true)
      toast.success('Link reset password telah dikirim ke email Anda!')
    } catch (error) {
      console.error('Error reset password:', error.message)
      toast.error('Gagal mengirim link reset: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="ambient-orb orb-primary"></div>
      <div className="ambient-orb orb-accent"></div>

      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <div className="logo-placeholder">❄️</div>
          <h1>Lupa Password</h1>
          <p>Masukkan email terdaftar untuk menerima link reset password</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleResetRequest} className="login-form">
            <div className="form-group-login">
              <label htmlFor="email">Email / Gmail</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="input-icon-left" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              Kirim Link Reset
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <p style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Link Telah Dikirim</p>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', marginTop: '8px' }}>
              Silakan periksa kotak masuk atau folder spam email <strong>{email}</strong> Anda untuk melanjutkan pengaturan ulang password.
            </p>
          </div>
        )}

        <div className="login-footer" style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', margin: 0 }}>
            <Link to="/login" className="link-highlight" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
