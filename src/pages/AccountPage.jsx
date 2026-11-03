import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { productOptions, selectionComplete, cleanSelection } from '../utils/options';
import { getCurrentUser, changePassword } from '../services/api';
import { SmartImage } from '../components/SmartImage';
import { sizedImage } from '../utils/images';
import './AccountPage.css';
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  LogOut,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
  Gift,
  Wallet,
  Truck,
  Eye,
  EyeOff,
  AlertCircle,
  LayoutDashboard,
  RotateCcw,
  Check
} from 'lucide-react';

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
const niceDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// Same wording as the Track order page.
const ORDER_STATUS = {
  PROCESSING: { text: 'Received', tone: 'info' },
  PENDING: { text: 'Received', tone: 'info' },
  CONFIRMED: { text: 'Confirmed', tone: 'info' },
  SHIPPED: { text: 'On the way', tone: 'info' },
  DELIVERED: { text: 'Delivered', tone: 'success' },
  CANCELLED: { text: 'Cancelled', tone: 'danger' },
};
const PAYMENT_STATUS = {
  PENDING: { text: 'Not paid yet', tone: 'warning' },
  VERIFYING: { text: 'Checking payment', tone: 'warning' },
  PAID: { text: 'Paid', tone: 'success' },
  REFUNDED: { text: 'Refunded', tone: 'muted' },
};
const isActive = (o) => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus);

// Lets any signed-in user (including the admin) change their password from the website.
const ChangePasswordForm = () => {
  const { showToast } = useStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) { setError('Your new password needs at least 8 characters.'); return; }
    if (next !== confirm) { setError("The two new passwords don't match."); return; }
    setError('');
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      showToast('Password changed', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';
  return (
    <form onSubmit={submit} className="ac-card" noValidate>
      <div className="ac-card-head">
        <h2>Password</h2>
        <button type="button" className="ac-link" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />} {show ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="ac-fields">
        <label className="ac-field ac-field-wide">
          <span>Current password</span>
          <input type={type} autoComplete="current-password" required value={current} onChange={(e) => { setCurrent(e.target.value); setError(''); }} />
        </label>
        <label className="ac-field">
          <span>New password</span>
          <input type={type} autoComplete="new-password" required value={next} onChange={(e) => { setNext(e.target.value); setError(''); }} />
          <small className={next.length >= 8 ? 'is-ok' : ''}>{next.length >= 8 ? <><Check size={12} /> Long enough</> : 'At least 8 characters'}</small>
        </label>
        <label className="ac-field">
          <span>Repeat new password</span>
          <input type={type} autoComplete="new-password" required value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} />
        </label>
      </div>
      {error && <p className="ac-error" role="alert"><AlertCircle size={14} /> {error}</p>}
      <button type="submit" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={!current || !next || !confirm}>
        Change password
      </button>
    </form>
  );
};

export const AccountPage = () => {
  const {
    user, logout, updateProfile, openAuth, navigate, showToast,
    referralInfo, setReferralModalOpen, products, addToCart, setCartDrawerOpen
  } = useStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // Edit profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Accra');
  const [address, setAddress] = useState('');

  const fetchOrders = useCallback(() => {
    if (!user?.id) return;
    setLoadingOrders(true);
    getCurrentUser()
      .then((fresh) => {
        if (fresh && fresh.orders) setUserOrders(fresh.orders);
      })
      .catch(() => {})
      .finally(() => { setLoadingOrders(false); setOrdersLoaded(true); });
  }, [user?.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const resetProfileForm = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setCity(user?.city || 'Accra');
    setAddress(user?.address || '');
  };
  useEffect(resetProfileForm, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="section ac-page">
        <div className="container ac-signedout">
          <div className="ac-signedout-icon"><User size={30} /></div>
          <h1>Your account</h1>
          <p>Sign in to follow your orders, save your delivery address and use your store credit.</p>
          <ul className="ac-perks">
            <li><Package size={16} aria-hidden="true" /> See every order and where it is</li>
            <li><Truck size={16} aria-hidden="true" /> Faster checkout with your saved address</li>
            <li><Gift size={16} aria-hidden="true" /> Earn GH₵10 credit for each friend you invite</li>
          </ul>
          <div className="ac-signedout-actions">
            <button type="button" onClick={() => openAuth('login')} className="btn btn-primary btn-lg">Sign in</button>
            <button type="button" onClick={() => openAuth('register')} className="btn btn-outline btn-lg">Create account</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      await updateProfile({ name, phone, city, address });
      setEditingProfile(false);
    } catch {
      // Toast handled in context
    } finally {
      setSavingProfile(false);
    }
  };

  // Puts this order's items back in the cart, using today's prices and skipping anything no longer sold.
  const buyAgain = (order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    let added = 0;
    items.forEach((it) => {
      const product = (products || []).find((p) => p.id === it.id);
      // Same size/colour as last time — unless that choice no longer exists.
      const choiceStillValid = !productOptions(product).length || selectionComplete(product, it.options);
      if (product && product.inStock !== false && choiceStillValid) {
        addToCart(product, it.qty || it.quantity || 1, cleanSelection(product, it.options));
        added += 1;
      }
    });
    if (added === 0) {
      showToast("These items aren't available right now. Ask us on WhatsApp.", 'warning');
    } else {
      if (added < items.length) showToast(`${items.length - added} item${items.length - added === 1 ? ' is' : 's are'} no longer available`, 'info');
      setCartDrawerOpen(true);
    }
  };

  const activeOrders = userOrders.filter(isActive);
  const pastOrders = userOrders.filter((o) => !isActive(o));
  const credit = referralInfo?.creditBalance || 0;
  const firstName = user.name.split(' ')[0];

  const renderOrder = (ord) => {
    const status = ORDER_STATUS[ord.orderStatus] || ORDER_STATUS.PROCESSING;
    const payment = PAYMENT_STATUS[ord.paymentStatus];
    const items = Array.isArray(ord.items) ? ord.items : [];
    const count = items.reduce((n, it) => n + (it.qty || it.quantity || 1), 0);
    return (
      <li key={ord.id || ord.orderCode} className="ac-order">
        <div className="ac-order-top">
          <div className="ac-order-id">
            <strong>#{ord.orderCode}</strong>
            <span>{niceDate(ord.createdAt)} · {count} item{count === 1 ? '' : 's'}</span>
          </div>
          <strong className="ac-order-total">{money(ord.total)}</strong>
        </div>

        <div className="ac-badges">
          <span className={`ac-badge is-${status.tone}`}>{status.text}</span>
          {payment && ord.orderStatus !== 'CANCELLED' && <span className={`ac-badge is-${payment.tone}`}>{payment.text}</span>}
          {ord.deliveryMethod && <span className="ac-badge is-plain">{ord.deliveryMethod}</span>}
        </div>

        {items.length > 0 && (
          <div className="ac-thumbs">
            {items.slice(0, 4).map((it, i) => (
              <SmartImage key={i} src={sizedImage(it.image || '', 120)} alt={it.name} className="ac-thumb" />
            ))}
            {items.length > 4 && <span className="ac-thumb ac-thumb-more">+{items.length - 4}</span>}
          </div>
        )}

        <div className="ac-order-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('track-order', { prefillCode: ord.orderCode })}>
            Track <ArrowRight size={14} />
          </button>
          {items.length > 0 && (
            <button type="button" className="btn btn-sm ac-ghost" onClick={() => buyAgain(ord)}>
              <RotateCcw size={14} /> Buy again
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="section ac-page">
      <div className="container ac-container">
        {/* Greeting */}
        <header className="ac-hero">
          <div className="ac-hero-who">
            <div className="ac-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
            <div className="ac-hero-text">
              <h1>Hi, {firstName}</h1>
              <span>{user.email}</span>
            </div>
          </div>
          <div className="ac-hero-actions">
            {user.role === 'ADMIN' && (
              <button type="button" className="ac-hero-btn is-strong" onClick={() => navigate('admin')}>
                <LayoutDashboard size={16} /> Admin dashboard
              </button>
            )}
            <button type="button" className="ac-hero-btn" onClick={logout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        {/* At a glance */}
        <div className="ac-stats">
          <button type="button" className="ac-stat" onClick={() => setActiveTab('orders')}>
            <span className="ac-stat-icon"><Package size={18} /></span>
            <span className="ac-stat-body">
              <strong>{ordersLoaded ? activeOrders.length : '–'}</strong>
              <span>Active order{activeOrders.length === 1 ? '' : 's'}</span>
            </span>
          </button>
          <button type="button" className="ac-stat" onClick={() => setReferralModalOpen(true)}>
            <span className="ac-stat-icon is-green"><Wallet size={18} /></span>
            <span className="ac-stat-body">
              <strong>{money(credit)}</strong>
              <span>Store credit</span>
            </span>
          </button>
          <button type="button" className="ac-stat ac-stat-invite" onClick={() => setReferralModalOpen(true)}>
            <span className="ac-stat-icon is-orange"><Gift size={18} /></span>
            <span className="ac-stat-body">
              <strong>Invite a friend</strong>
              <span>You both get GH₵{referralInfo?.rewardAmount ?? 10}</span>
            </span>
            <ArrowRight size={16} className="ac-stat-arrow" />
          </button>
        </div>

        {/* Tabs */}
        <div className="ac-tabs" role="tablist">
          {[
            { id: 'orders', label: `Orders${ordersLoaded ? ` (${userOrders.length})` : ''}` },
            { id: 'profile', label: 'Profile & password' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ac-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <section aria-label="Your orders">
            <div className="ac-section-head">
              <h2>{activeOrders.length ? 'In progress' : 'Your orders'}</h2>
              <button type="button" className="ac-link" onClick={fetchOrders} disabled={loadingOrders}>
                <RefreshCw size={14} className={loadingOrders ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {!ordersLoaded ? (
              <ul className="ac-orders" aria-hidden="true">
                {[0, 1].map((i) => <li key={i} className="ac-order ac-order-skeleton"><span /><span /><span /></li>)}
              </ul>
            ) : userOrders.length === 0 ? (
              <div className="ac-empty">
                <ShoppingBag size={26} aria-hidden="true" />
                <h3>No orders yet</h3>
                <p>When you place an order, you'll be able to follow it here.</p>
                <button type="button" onClick={() => navigate('shop')} className="btn btn-primary">
                  Start shopping <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {activeOrders.length > 0 ? (
                  <ul className="ac-orders">{activeOrders.map(renderOrder)}</ul>
                ) : (
                  <p className="ac-muted">Nothing on the way right now.</p>
                )}

                {pastOrders.length > 0 && (
                  <div className="ac-past">
                    <button type="button" className="ac-past-toggle" onClick={() => setShowPast((s) => !s)} aria-expanded={showPast}>
                      {showPast ? 'Hide' : 'Show'} past orders ({pastOrders.length})
                    </button>
                    {showPast && <ul className="ac-orders">{pastOrders.map(renderOrder)}</ul>}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <div className="ac-profile">
            <section className="ac-card">
              <div className="ac-card-head">
                <h2>Delivery details</h2>
                {!editingProfile && (
                  <button type="button" className="ac-link" onClick={() => setEditingProfile(true)}>Edit</button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="ac-fields">
                    <label className="ac-field ac-field-wide">
                      <span>Full name</span>
                      <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="ac-field">
                      <span>Phone (WhatsApp)</span>
                      <input type="tel" inputMode="tel" autoComplete="tel" placeholder="024 412 3456" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <label className="ac-field">
                      <span>Town or city</span>
                      <input type="text" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                    </label>
                    <label className="ac-field ac-field-wide">
                      <span>Address or landmark</span>
                      <input type="text" autoComplete="street-address" placeholder="Hse No. 12, Asokwa" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </label>
                  </div>
                  <p className="ac-muted">We fill these in for you at checkout.</p>
                  <div className="ac-form-actions">
                    <button type="submit" className={`btn btn-primary ${savingProfile ? 'is-loading' : ''}`} disabled={!name.trim()}>
                      Save changes
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => { resetProfileForm(); setEditingProfile(false); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="ac-details">
                  <div><dt><User size={15} /> Name</dt><dd>{user.name}</dd></div>
                  <div><dt><Mail size={15} /> Email</dt><dd>{user.email}</dd></div>
                  <div>
                    <dt><Phone size={15} /> Phone</dt>
                    <dd>{user.phone || <button type="button" className="ac-link" onClick={() => setEditingProfile(true)}>Add phone number</button>}</dd>
                  </div>
                  <div>
                    <dt><MapPin size={15} /> Address</dt>
                    <dd>{user.address ? `${user.address}, ${user.city}` : <button type="button" className="ac-link" onClick={() => setEditingProfile(true)}>Add delivery address</button>}</dd>
                  </div>
                </dl>
              )}
            </section>

            <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>
  );
};
