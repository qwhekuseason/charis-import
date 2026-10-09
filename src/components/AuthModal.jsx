import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Lock, Mail, User, Phone, MapPin, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    register
  } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Accra');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          phone,
          city,
          address
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthModalOpen(false);
      }}
    >
      <div
        className="glass-panel"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            padding: '24px 28px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            onClick={() => setAuthModalOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}
            >
              CHARIS SECURE
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '4px 0', color: '#ffffff' }}>
            {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0 }}>
            {authMode === 'login'
              ? 'Sign in to access your pre-orders, vessel tracking & wallet'
              : 'Join CHARIS to track container shipments & access wholesale waves'}
          </p>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '4px',
              marginTop: '18px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                backgroundColor: authMode === 'login' ? '#ffffff' : 'transparent',
                color: authMode === 'login' ? '#0f172a' : '#cbd5e1',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                backgroundColor: authMode === 'register' ? '#ffffff' : 'transparent',
                color: authMode === 'register' ? '#0f172a' : '#cbd5e1',
                transition: 'all 0.2s'
              }}
            >
              Register
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: 'var(--bg-card)' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div>{error}</div>
              {error.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Already have an account? Click here to Sign In →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {authMode === 'register' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number (WhatsApp)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      type="tel"
                      placeholder="e.g. +233 59 144 0934"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      City / Region
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="Accra">Greater Accra</option>
                      <option value="Kumasi">Kumasi (Ashanti)</option>
                      <option value="Takoradi">Takoradi (Western)</option>
                      <option value="Tamale">Tamale (Northern)</option>
                      <option value="Cape Coast">Cape Coast (Central)</option>
                      <option value="Other">Other Region</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. East Legon"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)'
              }}
            >
              {loading ? (
                'Processing...'
              ) : authMode === 'login' ? (
                <>
                  Sign In to Account <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
