import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { resetPassword } from '../services/api';
import { Eye, EyeOff, AlertCircle, Check, KeyRound, Clock } from 'lucide-react';

// The code from the reset email. It's read once, then removed from the address bar
// so it doesn't linger in browser history or get shared in a screenshot.
const readTokenFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    if (token) {
      window.history.replaceState(null, '', `${window.location.pathname}#/reset-password`);
      sessionStorage.setItem('chari_reset_token', token);
      return token;
    }
    return sessionStorage.getItem('chari_reset_token') || '';
  } catch {
    return '';
  }
};

export const ResetPasswordPage = () => {
  const { openAuth, navigate } = useStore();
  const [token] = useState(readTokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(!token);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const askForNewLink = () => openAuth('forgot');

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setError('');
    setSaving(true);
    try {
      await resetPassword(token, password);
      try { sessionStorage.removeItem('chari_reset_token'); } catch {}
      setDone(true);
      // Reload into the account page so the new sign-in is picked up everywhere.
      setTimeout(() => {
        window.location.replace(`${window.location.pathname}#/account`);
        window.location.reload();
      }, 1500);
    } catch (err) {
      if (err.expired) {
        try { sessionStorage.removeItem('chari_reset_token'); } catch {}
        setExpired(true);
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <div className="section">
      <div className="container rp-wrap">
        <div className="rp-card">
          {done ? (
            <div className="rp-center">
              <div className="rp-icon is-done"><Check size={28} strokeWidth={3} /></div>
              <h1>Password changed</h1>
              <p>You're signed in. Taking you to your account…</p>
            </div>
          ) : expired ? (
            <div className="rp-center">
              <div className="rp-icon is-warn"><Clock size={26} /></div>
              <h1>This link has expired</h1>
              <p>Reset links work once and only for 1 hour. Ask for a new one and we'll email it straight away.</p>
              <button type="button" className="btn btn-primary btn-block" onClick={askForNewLink}>Send me a new link</button>
              <button type="button" className="rp-link" onClick={() => navigate('home')}>Back to the shop</button>
            </div>
          ) : (
            <>
              <div className="rp-center">
                <div className="rp-icon"><KeyRound size={26} /></div>
                <h1>Choose a new password</h1>
                <p>You'll be signed in straight after. Any other phones or computers signed in to your account will be signed out.</p>
              </div>
              <form onSubmit={submit} noValidate>
                <label className="form-field" htmlFor="rp-new">
                  <span className="form-label">New password</span>
                  <div className="auth-password">
                    <input id="rp-new" ref={inputRef} className="form-input" type={type} autoComplete="new-password" placeholder="At least 8 characters"
                      value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
                    <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <span className={`auth-hint ${password.length >= 8 ? 'is-ok' : ''}`}>
                      {password.length >= 8 ? <><Check size={12} /> Good length</> : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}`}
                    </span>
                  )}
                </label>
                <label className="form-field" htmlFor="rp-confirm">
                  <span className="form-label">Repeat new password</span>
                  <input id="rp-confirm" className="form-input" type={type} autoComplete="new-password"
                    value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} />
                  {confirm && confirm === password && <span className="auth-hint is-ok"><Check size={12} /> Passwords match</span>}
                </label>
                {error && <p className="auth-field-error" role="alert"><AlertCircle size={14} /> {error}</p>}
                <button type="submit" className={`btn btn-primary btn-block auth-submit ${saving ? 'is-loading' : ''}`} disabled={!password || !confirm}>
                  Save new password
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
