import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const url = isRegister ? `${apiBaseUrl}/api/auth/register` : `${apiBaseUrl}/api/auth/login`;
      
      let initOptions = {};
      if (isRegister) {
        initOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        };
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        initOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        };
      }

      const res = await fetch(url, initOptions);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Authentication failed');

      if (isRegister) {
        setIsRegister(false);
        setError('Registration successful. Please log in.');
      } else {
        login(data.access_token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '2rem' }} className="glass">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {isRegister ? 'Register Account' : 'Auditor Login'}
      </h2>
      
      {error && <div style={{ color: '#fca5a5', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none' }}
          />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none' }}
          />
        </div>
        
        <button type="submit" className="btn" style={{ width: '100%' }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button 
          onClick={() => setIsRegister(!isRegister)} 
          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer' }}
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}
