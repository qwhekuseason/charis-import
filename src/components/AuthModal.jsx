import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X } from 'lucide-react';

export const AuthModal = () => {
  const { setAuthModalOpen, authMode, setAuthMode, login, register, pendingInviteCode } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Kumasi');
  const [inviteCode, setInviteCode] = useState(pendingInviteCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = authMode === 'login';
  const close = () => setAuthModalOpen(false);
  const switchMode = (mode) => { setAuthMode(mode); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ name, email, password, phone, city, referralCode: inviteCode.trim() || undefined });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal-panel modal-panel-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-header">
          <div>
            <h2 id="auth-title" className="modal-title">{isLogin ? 'Sign in' : 'Create your account'}</h2>
            <p className="modal-subtitle">
              {isLogin ? 'See your orders, saved items and store credit.' : 'It’s free and takes less than a minute.'}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={close} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => switchMode('login')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'active' : ''} onClick={() => switchMode('register')}>
              Create account
            </button>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
              {error.toLowerCase().includes('already exists') && (
                <button type="button" className="shop-link-btn" onClick={() => switchMode('login')} style={{ display: 'block', marginTop: '6px' }}>
                  Sign in instead
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-field">
                <label className="form-label" htmlFor="auth-name">Full name</label>
                <input id="auth-name" className="form-input" required autoComplete="name" placeholder="e.g. Kwame Mensah" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="auth-email">Email</label>
              <input id="auth-email" className="form-input" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                required
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="auth-phone">WhatsApp number</label>
                    <input id="auth-phone" className="form-input" type="tel" autoComplete="tel" placeholder="024 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="auth-city">City</label>
                    <select id="auth-city" className="form-input" value={city} onChange={(e) => setCity(e.target.value)}>
                      <option value="Accra">Accra</option>
                      <option value="Kumasi">Kumasi</option>
                      <option value="Takoradi">Takoradi</option>
                      <option value="Tamale">Tamale</option>
                      <option value="Cape Coast">Cape Coast</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="auth-invite">Invite code <span className="form-optional">(optional)</span></label>
                  <input id="auth-invite" className="form-input" placeholder="e.g. CHARI-7KQ2MX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
                  {inviteCode && <p className="form-hint">You’ll get GH₵25 off your first order.</p>}
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
