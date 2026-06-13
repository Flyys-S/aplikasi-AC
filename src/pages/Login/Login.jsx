import React, { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import PageLoader from '../../components/PageLoader'
import Button from '../../components/Button'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { user, signInWithGoogle, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const handleManualLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Silakan masukkan email dan password Anda.')
      return
    }

    try {
      setAuthLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      if (error) throw error
      toast.success('Selamat datang kembali!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Error logging in:', error.message)
      toast.error('Gagal masuk: ' + error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return <PageLoader text="Menghubungkan ke sistem..." />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="login-container">
      {/* Visual Ambient Light Orbs for beautiful glass depth */}
      <div className="ambient-orb orb-primary"></div>
      <div className="ambient-orb orb-accent"></div>

      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <div className="logo-placeholder">❄️</div>
          <h1>MITRA MAJU SEJATI</h1>
          <p>Sistem Tata Udara & Retail AC</p>
        </div>

        <form onSubmit={handleManualLogin} className="login-form">
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
                disabled={authLoading}
              />
            </div>
          </div>

          <div className="form-group-login">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
                Lupa Password?
              </Link>
            </div>
            <div className="login-input-wrapper">
              <Lock size={18} className="input-icon-left" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                disabled={authLoading}
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

          <Button
            type="submit"
            fullWidth
            icon={LogIn}
            loading={authLoading}
            disabled={authLoading}
            style={{ marginTop: '8px' }}
          >
            Masuk ke Sistem
          </Button>
        </form>

        <div className="login-divider">
          <span>atau masuk menggunakan</span>
        </div>

        <button
          className="google-btn"
          onClick={signInWithGoogle}
          disabled={authLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <div className="login-footer" style={{ marginTop: '28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', margin: 0 }}>
            Belum terdaftar? <Link to="/signup" className="link-highlight">Buat Akun Baru</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
