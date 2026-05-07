import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './Login.css'; // Reusing login styles

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone
          }
        }
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      // Wait a bit then navigate to login
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <h1>Buat Akun</h1>
          <p>Bergabung dengan Sistem Retail AC</p>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.1)', 
            color: '#ff4d4d', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success-msg" style={{ 
            backgroundColor: 'rgba(0, 255, 0, 0.1)', 
            color: '#00cc66', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <CheckCircle2 size={16} style={{ marginRight: '8px' }} />
            Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.
          </div>
        )}

        <form onSubmit={handleSignUp} className="login-form">
          <InputField 
            label="Nama Lengkap" 
            placeholder="John Doe" 
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <InputField 
            label="Email" 
            placeholder="admin@acretail.com" 
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <InputField 
            label="Nomor Telepon" 
            placeholder="08123456789" 
            icon={Phone}
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <InputField 
            label="Password" 
            type="password"
            placeholder="••••••••" 
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <Button type="submit" fullWidth onClick={handleSignUp} className="mt-4">
            {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </Button>
        </form>

        <div className="login-footer">
          <p>Sudah punya akun? <Link to="/" className="link">Masuk di sini</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
