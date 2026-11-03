import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { requestPasswordReset } from '../services/api';
import { X, Eye, EyeOff, AlertCircle, Check, Package, Gift, Truck, ArrowLeft, MailCheck, MessageCircle } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthModal = () => {
  const { setAuthModalOpen, authMode, setAuthMode, login, register, pendingInviteCode, WHATSAPP_NUMBER } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Kumasi');
  const [inviteCode, setInviteCode] = useState(pendingInviteCode || '');
  const [showInvite, setShowInvite] = useState(Boolean(pendingInviteCode));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);
  // Forgot password: the address the link was sent to, and whether email is set up on the server.
  const [resetSentTo, setResetSentTo] = useState('');
  const [emailUnavailable, setEmailUnavailable] = useState(false);

  const isForgot = authMode === 'forgot';
  const isLogin = authMode === 'login';
  const close = () => setAuthModalOpen(false);
  const switchMode = (mode) => { setAuthMode(mode); setError(''); setFieldErrors({}); setResetSentTo(''); };

  // Put the cursor in the first empty field when the popup opens or the mode changes.
  useEffect(() => {
    const first = [...(formRef.current?.querySelectorAll('input') || [])].find((el) => !el.value);
    first?.focus({ preventScroll: true });
  }, [authMode]);

  const clearFieldError = (key) => {
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (error) setError('');
  };

  const validate = () => {
    const found = {};
    if (!isLogin && !name.trim()) found.name = 'Enter your name.';
    if (!email.trim()) found.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email.trim())) found.email = 'This email address doesn’t look right.';
    if (!password) found.password = 'Enter your password.';
    else if (!isLogin && password.length < 8) found.password = 'Use at least 8 characters.';
    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setFieldErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register({ name: name.trim(), email: email.trim(), password, phone, city, referralCode: inviteCode.trim() || undefined });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setFieldErrors({ email: address ? 'This email address doesn’t look right.' : 'Enter the email you signed up with.' });
      formRef.current?.querySelector('[name="email"]')?.focus();
      return;
    }
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(address);
      setResetSentTo(address);
    } catch (err) {
      setEmailUnavailable(Boolean(err.emailUnavailable));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forgotLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello CHARI, I forgot the password for my account (${email.trim() || 'my email'}). Please help me reset it.`)}`;
  const accountExists = error.toLowerCase().includes('already exists');
  const wrongLogin = isLogin && /invalid email or password/i.test(error);

  const fieldProps = (key) => ({
    name: key,
    'aria-invalid': Boolean(fieldErrors[key]),
    'aria-describedby': fieldErrors[key] ? `auth-${key}-error` : undefined,
  });
  const fieldError = (id) => (fieldErrors[id] ? (
    <span className="auth-field-error" id={`auth-${id}-error`} role="alert"><AlertCircle size={13} /> {fieldErrors[id]}</span>
  ) : null);

  if (isForgot) {
    return (
      <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="modal-panel modal-panel-sm auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="modal-header">
            <div>
              <h2 id="auth-title" className="modal-title">{resetSentTo ? 'Check your email' : 'Reset your password'}</h2>
              <p className="modal-subtitle">
                {resetSentTo ? 'The link is on its way.' : 'Enter your email and we’ll send you a link to choose a new password.'}
              </p>
            </div>
            <button type="button" className="modal-close" onClick={close} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {resetSentTo ? (
              <div className="auth-sent">
                <div className="auth-sent-icon"><MailCheck size={28} /></div>
                <p>
                  If there’s a CHARI account for <strong>{resetSentTo}</strong>, we’ve emailed it a reset link.
                  It works once and expires in 1 hour.
                </p>
                <p className="auth-sent-tip">Not there after a few minutes? Check your spam or promotions folder.</p>
                <button type="button" className="btn btn-primary btn-block auth-submit" onClick={() => switchMode('login')}>
                  Back to sign in
                </button>
                <button type="button" className={`auth-invite-toggle auth-center ${loading ? 'is-busy' : ''}`} onClick={handleForgot} disabled={loading}>
                  {loading ? 'Sending…' : 'Send the link again'}
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="form-error auth-error" role="alert">
                    <AlertCircle size={16} />
                    <div>
                      {error}
                      {emailUnavailable && (
                        <a className="shop-link-btn" href={forgotLink} target="_blank" rel="noreferrer">
                          <MessageCircle size={14} /> Ask us on WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <form onSubmit={handleForgot} ref={formRef} noValidate>
                  <div className={`form-field ${fieldErrors.email ? 'has-error' : ''}`}>
                    <label className="form-label" htmlFor="auth-email">Email</label>
                    <input id="auth-email" className="form-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                      placeholder="you@example.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} {...fieldProps('email')} />
                    {fieldError('email')}
                  </div>
                  <button type="submit" className={`btn btn-primary btn-block auth-submit ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
                    Send reset link
                  </button>
                </form>
                <button type="button" className="auth-back" onClick={() => switchMode('login')}>
                  <ArrowLeft size={15} /> Back to sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal-panel modal-panel-sm auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-header">
          <div>
            <h2 id="auth-title" className="modal-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="modal-subtitle">
              {isLogin ? 'Sign in to see your orders, saved items and store credit.' : 'It’s free and takes less than a minute.'}
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

          {!isLogin && (
            <ul className="auth-perks">
              <li><Package size={14} aria-hidden="true" /> Follow every order</li>
              <li><Truck size={14} aria-hidden="true" /> Faster checkout</li>
              <li><Gift size={14} aria-hidden="true" /> GH₵10 per friend invited</li>
            </ul>
          )}

          {error && (
            <div className="form-error auth-error" role="alert">
              <AlertCircle size={16} />
              <div>
                {error}
                {accountExists && (
                  <button type="button" className="shop-link-btn" onClick={() => switchMode('login')}>Sign in instead</button>
                )}
                {wrongLogin && (
                  <button type="button" className="shop-link-btn" onClick={() => switchMode('forgot')}>Forgot your password?</button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} ref={formRef} noValidate>
            {!isLogin && (
              <div className={`form-field ${fieldErrors.name ? 'has-error' : ''}`}>
                <label className="form-label" htmlFor="auth-name">Full name</label>
                <input id="auth-name" className="form-input" autoComplete="name" placeholder="Kwame Mensah" value={name}
                  onChange={(e) => { setName(e.target.value); clearFieldError('name'); }} {...fieldProps('name')} />
                {fieldError('name')}
              </div>
            )}

            <div className={`form-field ${fieldErrors.email ? 'has-error' : ''}`}>
              <label className="form-label" htmlFor="auth-email">Email</label>
              <input id="auth-email" className="form-input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                placeholder="you@example.com" value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }} {...fieldProps('email')} />
              {fieldError('email')}
            </div>

            <div className={`form-field ${fieldErrors.password ? 'has-error' : ''}`}>
              <div className="auth-label-row">
                <label className="form-label" htmlFor="auth-password">Password</label>
                {isLogin && (
                  <button type="button" className="auth-forgot" onClick={() => switchMode('forgot')}>Forgot password?</button>
                )}
              </div>
              <div className="auth-password">
                <input
                  id="auth-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  {...fieldProps('password')}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldError('password')}
              {!isLogin && !fieldErrors.password && password && (
                <span className={`auth-hint ${password.length >= 8 ? 'is-ok' : ''}`}>
                  {password.length >= 8 ? <><Check size={12} /> Good length</> : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}`}
                </span>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="auth-phone">WhatsApp number <span className="form-optional">(optional)</span></label>
                    <input id="auth-phone" className="form-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

                {showInvite ? (
                  <div className="form-field">
                    <label className="form-label" htmlFor="auth-invite">Invite code <span className="form-optional">(optional)</span></label>
                    <input id="auth-invite" className="form-input auth-code" placeholder="CHARI-7KQ2MX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
                    {inviteCode && <p className="form-hint">If the code is valid, you’ll get GH₵10 off your first order.</p>}
                  </div>
                ) : (
                  <button type="button" className="auth-invite-toggle" onClick={() => setShowInvite(true)}>
                    Have an invite code from a friend?
                  </button>
                )}
              </>
            )}

            <button type="submit" className={`btn btn-primary btn-block auth-submit ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'New to CHARI? ' : 'Already have an account? '}
            <button type="button" className="shop-link-btn" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
