import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import Button from '../components/Button';
import InputField from '../components/InputField';
import './Login.css'; // Reusing login styles

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel fade-in">
        <div className="login-header">
          <h1>Buat Akun</h1>
          <p>Bergabung dengan Sistem Retail AC</p>
        </div>

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
          <p>Sudah punya akun? <span onClick={() => navigate('/')} className="link">Masuk di sini</span></p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
