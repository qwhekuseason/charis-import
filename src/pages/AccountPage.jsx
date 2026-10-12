import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { getCurrentUser, changePassword } from '../services/api';
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  Truck,
  ExternalLink,
  Edit2,
  Save,
  LogOut,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

// Lets any signed-in user (including the admin) change their password from the website.
const ChangePasswordForm = () => {
  const { showToast } = useStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { showToast('The new passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      showToast('Password changed.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>Change password</h4>
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">Current password</span>
          <input className="form-input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <span />
      </div>
      <div className="form-row">
        <label className="form-field">
          <span className="form-label">New password</span>
          <input className="form-input" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="form-field">
          <span className="form-label">Repeat new password</span>
          <input className="form-input" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Change password'}</button>
    </form>
  );
};

export const AccountPage = () => {
  const { user, logout, updateProfile, openAuth, navigate, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'admin'
  const [editingProfile, setEditingProfile] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Accra');
  const [address, setAddress] = useState('');

  const fetchOrders = useCallback(() => {
    if (!user) return;
    setLoadingOrders(true);
    getCurrentUser()
      .then((fresh) => {
        if (fresh && fresh.orders) {
          setUserOrders(fresh.orders);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCity(user.city || 'Accra');
      setAddress(user.address || '');
      fetchOrders();
    }
  }, [user, fetchOrders]);

  if (!user) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: '560px', textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <User size={36} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your account
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
            Sign in to see your orders, saved address and store credit.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => openAuth('login')}
              className="btn btn-primary"
              style={{ padding: '12px 28px' }}
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth('register')}
              className="btn btn-outline"
              style={{ padding: '12px 28px' }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone, city, address });
      setEditingProfile(false);
    } catch {
      // Toast handled in context
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* User Greeting Banner */}
        <div
          style={{
            background: '#1e40af',
            borderRadius: '20px',
            padding: '32px 36px',
            color: '#ffffff',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f97316',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {user.name}
                </h1>
                {user.role === 'ADMIN' && (
                  <span
                    style={{
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                {user.email} · {user.city || 'Ghana'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
             Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '28px'
          }}
        >
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'orders' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'orders' ? '3px solid #2563eb' : '3px solid transparent'
            }}
          >
            My Orders ({userOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'profile' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'profile' ? '3px solid #2563eb' : '3px solid transparent'
            }}
          >
            Delivery Profile
          </button>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'admin' ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === 'admin' ? '3px solid #3b82f6' : '3px solid transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
               Admin Dashboard
            </button>
          )}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {userOrders.length > 0 ? `${userOrders.length} order(s) found` : ''}
              </span>
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-light)',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem',
                  fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} style={{ animation: loadingOrders ? 'spin 1s linear infinite' : 'none' }} />
                {loadingOrders ? 'Refreshing...' : 'Refresh Orders'}
              </button>
            </div>
            {loadingOrders ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading your orders...</p>
            ) : userOrders.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '48px',
                  textAlign: 'center',
                  border: '1px solid var(--border-light)'
                }}
              >
                
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  No orders placed yet
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '20px' }}>
                  Browse our products and place your first order.
                </p>
                <button onClick={() => navigate('shop')} className="btn btn-primary">
                  Start Shopping <ShoppingBag size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userOrders.map((ord) => (
                  <div
                    key={ord.id || ord.orderCode}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '14px',
                      padding: '24px',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        borderBottom: '1px solid var(--border-light)',
                        paddingBottom: '16px',
                        marginBottom: '16px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order code</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          #{ord.orderCode}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {new Date(ord.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>
                          GH₵{ord.total?.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            backgroundColor:
                              ord.orderStatus === 'DELIVERED'
                                ? '#dcfce7'
                                : ord.orderStatus === 'SHIPPED'
                                ? '#e0f2fe'
                                : 'rgba(37, 99, 235, 0.12)',
                            color:
                              ord.orderStatus === 'DELIVERED'
                                ? '#166534'
                                : ord.orderStatus === 'SHIPPED'
                                ? '#0369a1'
                                : '#1d4ed8'
                          }}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                        {ord.items && Array.isArray(ord.items) ? (
                          `${ord.items.length} item(s) · Delivery: ${ord.deliveryMethod}`
                        ) : (
                          `Delivery: ${ord.deliveryMethod}`
                        )}
                      </div>
                      <button
                        onClick={() => {
                          navigate('track-order', { prefillCode: ord.orderCode });
                        }}
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        Track order →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border-light)',
              maxWidth: '680px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Personal Information
              </h3>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                   Edit Details
                </button>
              )}
            </div>

            {editingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.92rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.92rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      City / Region
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-medium)',
                        fontSize: '0.92rem',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-medium)',
                        fontSize: '0.92rem',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                     Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="btn btn-outline"
                    style={{ padding: '10px 20px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email Address</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phone Number</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.phone || 'Not set'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Default Delivery Address</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user.address ? `${user.address}, ${user.city}` : user.city || 'Ghana'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ChangePasswordForm />
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && user.role === 'ADMIN' && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Store admin
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                  Manage products, orders and customers from the admin dashboard.
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => navigate('admin')}>Open admin dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
};
