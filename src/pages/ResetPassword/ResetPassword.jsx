import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'
import GlassSpinner from '../../components/Loading/GlassSpinner'
import './ResetPassword.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast.error('Password minimal harus 6 karakter.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Sign out to clear the active session so they must log in with the new password
      await supabase.auth.signOut()

      setSuccess(true)
      toast.success('Password berhasil diperbarui!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      console.error('Error updating password:', error.message)
      toast.error('Gagal memperbarui password: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {loading && <GlassSpinner message="Mengatur ulang kata sandi..." />}
      <div className="ambient-orb orb-primary"></div>
      <div className="ambient-orb orb-accent"></div>

      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <div className="logo-placeholder">❄️</div>
          <h1>Reset Password Baru</h1>
          <p>Masukkan password baru untuk akun Anda</p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group-login">
              <label htmlFor="password">Password Baru</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group-login">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              Simpan Password Baru
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
            }}>
              <Check size={32} />
            </div>
            <p style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Password Berhasil Diubah!</p>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', marginTop: '8px' }}>
              Password Anda telah berhasil diperbarui. Mengalihkan Anda ke halaman login...
            </p>
          </div>
        )}

        {!success && (
          <div className="login-footer" style={{ marginTop: '28px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', margin: 0 }}>
              Batal melakukan reset? <Link to="/login" className="link-highlight">Masuk</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
